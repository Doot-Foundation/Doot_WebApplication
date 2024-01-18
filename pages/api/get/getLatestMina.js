const { redis } = require("../../../utils/helper/InitRedis");
const { MINA_CACHE } = require("../../../utils/constants/info");

export default async function handler(req, res) {
  const data = await redis.get(MINA_CACHE);
  return res.status(200).json({ cid: data });
}
