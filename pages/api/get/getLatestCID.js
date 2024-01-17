const { redis } = require("../../../utils/helper/InitRedis");
const { HISTORICAL_CACHE } = require("../../../utils/constants/info");

export default async function handler(req, res) {
  const data = await redis.get(HISTORICAL_CACHE);
  res.status(200).json({ cid: data });
}
