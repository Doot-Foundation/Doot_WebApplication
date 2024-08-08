const { redis } = require("../../../utils/helper/init/InitRedis.js");

const { MINA_CID_CACHE } = require("../../../utils/constants/info.js");
const sendMinaTxn = require("../../../utils/helper/SendMinaTxn.ts");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json("Unauthorized");
  }

  const array = await redis.get(MINA_CID_CACHE);
  //RESULTS : [IPFSHASH,COMMITMENT]
  const success = await sendMinaTxn(array);

  if (success)
    return res.status(200).json({ status: "Sent Txn On Mina Successfully!" });
  else return res.status(200).json({ status: "Txn Failure." });
}
