const unpin = require("./Unpin");
const { pinJsonAsTextFile, fetchJsonFromCid } = require("./pinataFile");

const ONE_YEAR = 60 * 60 * 24 * 365 * 1000;

function removeOldTimestamps(obj) {
  const currentTime = Date.now();
  Object.keys(obj.historical).forEach((key) => {
    if (currentTime - Number(key) > ONE_YEAR) {
      delete obj.historical[key];
    }
  });
}

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
      const previousObject = await fetchJsonFromCid(previousCID);

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

    removeOldTimestamps(toUploadObject);
    console.log("Removed Historical Data > 1Y(if any).");

    const uploadResponse = await pinJsonAsTextFile(
      toUploadObject,
      `historical_${timestamp}`
    );

    if (!uploadResponse || !uploadResponse.IpfsHash) {
      throw new Error("No IpfsHash returned from Pinata");
    }

    try {
      const verificationData = await fetchJsonFromCid(uploadResponse.IpfsHash);

      if (!verificationData || !verificationData.latest || !verificationData.historical) {
        throw new Error(
          "Invalid data structure: missing 'latest' or 'historical' properties"
        );
      }
    } catch (verifyError) {
      throw new Error(
        `New IPFS CID ${uploadResponse.IpfsHash} is not accessible: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`
      );
    }

    if (previousCID !== "NULL") {
      try {
        await unpin(previousCID, "Historical");
      } catch (unpinError) {
        console.warn(
          `Failed to unpin old CID ${previousCID}: ${unpinError.message}`
        );
      }
    }

    console.log("Pinned Historical Data:", uploadResponse);
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error(
      "Error pinning historical object:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = pinHistoricalObject;
