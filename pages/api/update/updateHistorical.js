import pinHistoricalObject from "../../../utils/helper/PinHistorical";

const {
  TOKEN_TO_CACHE,
  HISTORICAL_CACHE,
} = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");

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
    obj[`${item}`] = JSON.parse(data);
  }

  console.log(obj);

  const cid = await redis.get(HISTORICAL_CACHE);
  console.log("cid", cid);

  // const updatedCID = await pinHistoricalObject(cid, obj);
  // console.log(updatedCID);
  // await redis.set(HISTORICAL_CACHE, updatedCID);

  // res.status(200).json({ latest: updatedCID });
}
