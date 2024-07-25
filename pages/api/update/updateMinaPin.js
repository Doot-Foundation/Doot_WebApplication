import pinMinaObject from "../../../utils/helper/PinMinaObject.ts";

const {
  MINA_CID_CACHE,
  MINA_MAX_SIGNED_SLOT_CACHE,
} = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const toPin = {};
  const finalSlotState = {};

  const cache = await redis.get(MINA_MAX_SIGNED_SLOT_CACHE);
  const tokens = Object.keys(cache);

  for (const token of tokens) {
    const data = cache[item];
    toPin[token] = data;
    finalSlotState[token] = { community: {} };
  }

  const [hash, commitment] = await redis.get(MINA_CID_CACHE);
  const results = await pinMinaObject(toPin, hash);
  //RESULTS : [IPFSHASH,COMMITMENT]

  await redis.set(MINA_CID_CACHE, results);
  await redis.set(MINA_MAX_SIGNED_SLOT_CACHE, finalSlotState);

  return res.status(200).json({ latest: results });
}
