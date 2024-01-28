import getMinaDetails from "../../../utils/helper/GetMinaInfo.ts";
const { redis } = require("../../../utils/helper/InitRedis");
const { MINA_CACHE } = require("../../../utils/constants/info");

export default async function handler(req, res) {
  const latestPinnedInfo = await redis.get(MINA_CACHE);
  const data = await getMinaDetails(latestPinnedInfo[0]);
  return res.status(200).json({ data: data });
}
