import pinMinaObject from "../../../utils/helper/PinMinaObject.ts";

const {
  TOKEN_TO_CACHE,
  MINA_CACHE,
} = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const obj = {};
  const keys = Object.keys(TOKEN_TO_CACHE);

  for (const item of keys) {
    const data = await redis.get(TOKEN_TO_CACHE[item]);
    obj[`${item}`] = data;
  }

  const previousData = await redis.get(MINA_CACHE);
  const results = await pinMinaObject(obj, previousData[0]);
  //RESULTS : [IPFSHASH,COMMITMENT]
  await redis.set(MINA_CACHE, results);

  return res.status(200).json({ latest: results });
}
