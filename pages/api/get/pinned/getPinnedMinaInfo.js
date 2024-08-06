const { redis } = require("../../../../utils/helper/init/InitRedis.js");
const { MINA_CID_CACHE } = require("../../../../utils/constants/info.js");
const getMinaDetails = require("../../../../utils/helper/GetMinaInfo.ts");

export default async function handler(req, res) {
  const [cid, commitment] = await redis.get(MINA_CID_CACHE);

  const data = await getMinaDetails(cid);
  const status = Object.keys(data.IpfsData).length() == 0 ? false : true;
  return res.status(200).json({ status: status, data: data });
}
