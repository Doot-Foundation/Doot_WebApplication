import pinHistoricalObject from "../../../utils/helper/PinHistorical";

const {
  HISTORICAL_SIGNED_MAX_CACHE,
  HISTORICAL_CACHE,
} = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const obj = {};
  const finalSlotState = {};
  const CACHED_DATA = await redis.get(HISTORICAL_SIGNED_MAX_CACHE);
  const keys = Object.keys(CACHED_DATA);

  for (const item of keys) {
    const data = CACHED_DATA[item];
    obj[item] = data;
    finalSlotState[item] = { community: {} };
  }

  const cid = await redis.get(HISTORICAL_CACHE);
  const updatedCID = await pinHistoricalObject(cid, obj);
  await redis.set(HISTORICAL_CACHE, updatedCID);
  await redis.set(HISTORICAL_SIGNED_MAX_CACHE, finalSlotState);

  res.status(200).json({ latest: updatedCID });
}
