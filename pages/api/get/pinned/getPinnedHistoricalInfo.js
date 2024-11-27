const { redis } = require("@/utils/helper/init/InitRedis.js");
const { HISTORICAL_CID_CACHE } = require("@/utils/constants/info.js");
const getHistoricalInfo = require("@/utils/helper/GetHistoricalInfo.js");

export default async function handler(req, res) {
  const cid = await redis.get(HISTORICAL_CID_CACHE);

  const data = await getHistoricalInfo(cid);
  const status = data.length() == 0 ? false : true;
  return res.status(200).json({ status: status, data: data });
}
