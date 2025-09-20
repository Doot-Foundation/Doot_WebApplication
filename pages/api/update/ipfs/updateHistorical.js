const { redis } = require("@/utils/helper/init/InitRedis.js");

const { HISTORICAL_CID_CACHE } = require("@/utils/constants/info.js");
const pinHistoricalObject = require("@/utils/helper/PinHistorical.js");

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    const obj = {};

    // Get all token cache keys and fetch their data
    const { TOKEN_TO_CACHE } = require("@/utils/constants/info.js");
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);

    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey];
      const data = await redis.get(cacheKey);
      if (data) {
        obj[tokenKey] = data;
      }
    }

    const cid = await redis.get(HISTORICAL_CID_CACHE);

    if (!cid) {
      throw new Error("Historical CID not found in cache");
    }

    console.log(`Updating historical IPFS with previous CID: ${cid}`);
    const updatedCID = await pinHistoricalObject(cid, obj);

    if (!updatedCID) {
      throw new Error("Failed to get updated CID from pinHistoricalObject");
    }

    // IPFS PIN UPDATED.
    await redis.set(HISTORICAL_CID_CACHE, updatedCID);
    console.log(`Historical IPFS updated successfully. New CID: ${updatedCID}`);

    return res.status(200).json({
      status: true,
      message: "Updated historical data successfully.",
      data: {
        cid: updatedCID,
      },
    });
  } catch (error) {
    console.error("Error in updateHistorical handler:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to update historical data",
      error: error.message
    });
  }
}
