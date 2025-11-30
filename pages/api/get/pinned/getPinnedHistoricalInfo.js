const { redis } = require("@/utils/helper/init/InitRedis.js");
const { HISTORICAL_CID_CACHE } = require("@/utils/constants/info.js");
const getHistoricalInfo = require("@/utils/helper/GetHistoricalInfo.js");

export default async function handler(req, res) {
  try {
    const cid = await redis.get(HISTORICAL_CID_CACHE);
    if (!cid) {
      return res.status(500).json({
        status: false,
        error: "Historical CID not found",
      });
    }

    const data = await getHistoricalInfo(cid);
    const status = Boolean(data && Object.keys(data).length > 0);
    return res.status(200).json({ status, data, cid });
  } catch (error) {
    console.error("Failed to fetch pinned historical info:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message || "Unknown error",
    });
  }
}
