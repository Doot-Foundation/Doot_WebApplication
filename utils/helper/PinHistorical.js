const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const axios = require("axios");
const unpin = require("./Unpin");

const ONE_DAY_MS = 24 * 60 * 60 * 1000 * 365; // One year in milliseconds

/**
 * Removes timestamps older than 1 year
 */
function removeOldTimestamps(obj) {
  const currentTime = Date.now();
  Object.keys(obj.historical).forEach((key) => {
    if (currentTime - Number(key) > ONE_DAY_MS) {
      delete obj.historical[key];
    }
  });
}

/**
 * Pins historical price data to IPFS
 */
async function pinHistoricalObject(previousCID, latestPrices) {
  try {
    const timestamp = Date.now();
    let toUploadObject;

    if (previousCID === "NULL") {
      console.log("Fresh Historical: true");
      toUploadObject = {
        latest: {
          timestamp,
          prices: latestPrices,
        },
        historical: {},
      };
    } else {
      // Fetch and process previous data
      const { data: previousObject } = await axios.get(
        `https://${GATEWAY}/ipfs/${previousCID}`
      );

      const previousTimestamp = previousObject.latest.timestamp;

      toUploadObject = {
        latest: {
          timestamp,
          prices: latestPrices,
        },
        historical: {
          ...previousObject.historical,
          [previousTimestamp]: previousObject.latest.prices,
        },
      };
      console.log("Fresh Historical: false");
    }

    // Remove old data and prepare for upload
    removeOldTimestamps(toUploadObject);
    console.log("Removed Historical Data > 1Y(if any).");

    // Prepare upload options
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${JWT}`,
      },
      body: JSON.stringify({
        pinataContent: toUploadObject,
        pinataMetadata: {
          name: `historical_${timestamp}.json`,
        },
      }),
    };

    // SAFE PATTERN: Upload first, verify accessibility, then unpin old data
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options);

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error("No IpfsHash returned from Pinata");
    }

    // Critical: Verify the new CID returns valid data before unpinning old CID
    const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!GATEWAY) {
      throw new Error("Missing NEXT_PUBLIC_PINATA_GATEWAY environment variable");
    }

    try {
      const verificationResponse = await axios.get(
        `https://${GATEWAY}/ipfs/${data.IpfsHash}`,
        { timeout: 10000, headers: { Accept: 'application/json' } }
      );

      // Validate the data structure has required top-level properties
      if (!verificationResponse.data ||
          !verificationResponse.data.latest ||
          !verificationResponse.data.historical) {
        throw new Error("Invalid data structure: missing 'latest' or 'historical' properties");
      }
    } catch (verifyError) {
      throw new Error(`New IPFS CID ${data.IpfsHash} is not accessible: ${verifyError.message}`);
    }

    // Only NOW it's safe to unpin the old CID
    if (previousCID !== "NULL") {
      try {
        await unpin(previousCID, "Historical");
      } catch (unpinError) {
        // Don't fail the entire operation if unpinning fails
        console.warn(`Failed to unpin old CID ${previousCID}: ${unpinError.message}`);
      }
    }

    console.log("Pinned Historical Data:", data);
    return data.IpfsHash;
  } catch (error) {
    console.error(
      "Error pinning historical object:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = pinHistoricalObject;
