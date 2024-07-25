const { redis } = require("../../../../utils/helper/InitRedis.js");
const { MINA_CACHE } = require("../../../../utils/constants/info.js");
import getMinaDetails from "../../../../utils/helper/GetMinaInfo.ts";

export default async function handler(req, res) {
  const [hash, commitment] = await redis.get(MINA_CACHE);
  const data = await getMinaDetails(hash);
  return res.status(200).json({ data: data });
}
