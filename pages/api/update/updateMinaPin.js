import pinMinaObject from "../../../utils/helper/PinMinaObject.ts";

const {
  MINA_CACHE,
  MINA_SIGNED_MAX_CACHE,
} = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const obj = {};
  const finalSlotState = {};
  const CACHED_DATA = await redis.get(MINA_SIGNED_MAX_CACHE);
  const keys = Object.keys(CACHED_DATA);

  for (const item of keys) {
    const data = CACHED_DATA[item];
    obj[item] = data;
    finalSlotState[item] = { community: {} };
  }

  const previousData = await redis.get(MINA_CACHE);
  const results = await pinMinaObject(obj, previousData[0]);
  //RESULTS : [IPFSHASH,COMMITMENT]
  await redis.set(MINA_CACHE, results);
  await redis.set(MINA_SIGNED_MAX_CACHE, finalSlotState);

  return res.status(200).json({ latest: results });
}
