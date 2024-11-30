const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const axios = require("axios");
const unpin = require("./Unpin");

const ONE_DAY_MS = 24 * 60 * 60 * 1000 * 365; // One year in milliseconds

/**
 * Removes timestamps older than 24 hours
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

    // Upload to IPFS and unpin old data in parallel
    const [response, _] = await Promise.all([
      fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options),
      previousCID !== "NULL"
        ? unpin(previousCID, "Historical")
        : Promise.resolve(),
    ]);

    const data = await response.json();
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
