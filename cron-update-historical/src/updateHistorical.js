const { redis } = require("./utils/helper/init/InitRedis");
const {
  HISTORICAL_CID_CACHE,
  TOKEN_TO_CACHE,
} = require("./utils/constants/info");
const pinHistoricalObject = require("./utils/helper/PinHistorical");

async function updateHistorical() {
  console.log("UpdateHistorical: Starting historical IPFS data update...");

  try {
    const obj = {};
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);

    const validCacheKeys = [];
    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey];
      if (cacheKey && typeof cacheKey === "string" && cacheKey.trim() !== "") {
        validCacheKeys.push({ tokenKey, cacheKey });
      } else {
        console.warn(`Invalid cache key for token ${tokenKey}:`, cacheKey);
      }
    }

    for (const { tokenKey, cacheKey } of validCacheKeys) {
      try {
        const data = await redis.get(cacheKey);
        if (data) {
          obj[tokenKey] = data;
        }
      } catch (error) {
        console.error(
          `Failed to get cache for ${tokenKey} (${cacheKey}):`,
          error.message
        );
      }
    }

    if (!HISTORICAL_CID_CACHE || typeof HISTORICAL_CID_CACHE !== "string") {
      throw new Error("Invalid HISTORICAL_CID_CACHE key");
    }

    const cid = await redis.get(HISTORICAL_CID_CACHE);

    if (!cid) {
      throw new Error("Historical CID not found in cache");
    }

    console.log(`Updating historical IPFS with previous CID: ${cid}`);
    console.log(
      `Collected data for ${Object.keys(obj).length} tokens:`,
      Object.keys(obj)
    );

    const updatedCID = await pinHistoricalObject(cid, obj);

    if (!updatedCID) {
      throw new Error("Failed to get updated CID from pinHistoricalObject");
    }

    await redis.set(HISTORICAL_CID_CACHE, updatedCID);
    console.log(`Historical IPFS updated successfully. New CID: ${updatedCID}`);

    return {
      status: true,
      message: "Updated historical data successfully.",
      data: {
        cid: updatedCID,
      },
      updated: Date.now(),
    };
  } catch (error) {
    console.error("UpdateHistorical failed:", error);
    return {
      status: false,
      message: "Failed to update historical data",
      error: error.message || String(error),
    };
  }
}

module.exports = { updateHistorical };
