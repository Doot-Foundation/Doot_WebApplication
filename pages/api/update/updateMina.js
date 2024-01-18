import pinMinaObject from "../../../utils/helper/PinMina.ts";

const { TOKEN_TO_CACHE, MINA_CACHE } = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");

export const config = {
  maxDuration: 300,
};

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

  const updatedCID = await pinMinaObject(obj);
  await redis.set(MINA_CACHE, updatedCID);

  return res.status(200).json({ latest: updatedCID });
}
