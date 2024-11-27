const { redis } = require("@/utils/helper/init/InitRedis.js");

const { HISTORICAL_CID_CACHE } = require("@/utils/constants/info.js");
const pinHistoricalObject = require("@/utils/helper/PinHistorical.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json("Unauthorized");
  }

  const obj = {};

  const CACHED_DATA = await redis.get();
  const keys = Object.keys(CACHED_DATA);

  for (const key of keys) {
    const data = CACHED_DATA[key];
    obj[key] = data;
  }

  const cid = await redis.get(HISTORICAL_CID_CACHE);
  const updatedCID = await pinHistoricalObject(cid, obj);

  // IPFS PIN UPDATED.
  await redis.set(HISTORICAL_CID_CACHE, updatedCID);
  // RESET THE MAX SLOT AFTER THE HISTORICAL HAS BEEN UPDATED.

  return res.status(200).json({
    status: true,
    message: "Updated historical data successfully.",
    data: {
      cid: updatedCID,
    },
  });
}
