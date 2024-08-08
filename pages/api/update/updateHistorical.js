const { redis } = require("../../../utils/helper/init/InitRedis");

const {
  HISTORICAL_MAX_SIGNED_SLOT_CACHE,
  HISTORICAL_CID_CACHE,
} = require("../../../utils/constants/info");
const pinHistoricalObject = require("../../../utils/helper/PinHistorical.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json("Unauthorized");
  }

  const obj = {};
  const finalSlotState = {};

  const CACHED_DATA = await redis.get(HISTORICAL_MAX_SIGNED_SLOT_CACHE);
  const keys = Object.keys(CACHED_DATA);

  for (const key of keys) {
    const data = CACHED_DATA[key];
    obj[key] = data;
    finalSlotState[key] = { community: {} };
  }

  const cid = await redis.get(HISTORICAL_CID_CACHE);
  const updatedCID = await pinHistoricalObject(cid, obj);

  // IPFS PIN UPDATED.
  await redis.set(HISTORICAL_CID_CACHE, updatedCID);
  // RESET THE MAX SLOT AFTER THE HISTORICAL HAS BEEN UPDATED.
  await redis.set(HISTORICAL_MAX_SIGNED_SLOT_CACHE, finalSlotState);

  return res.status(200).json({
    status: true,
    message: "Updated historical data successfully.",
    data: {
      cid: updatedCID,
    },
  });
}
