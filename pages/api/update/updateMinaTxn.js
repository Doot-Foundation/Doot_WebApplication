import sendMinaTxn from "../../../utils/helper/SendMinaTxn.ts";

const { MINA_CACHE } = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const array = await redis.get(MINA_CACHE);
  //RESULTS : [IPFSHASH,COMMITMENT]
  const success = await sendMinaTxn(array);

  if (success)
    return res.status(200).json({ status: "Sent Txn On Mina Successfully!" });
  else return res.status(200).json({ status: "Txn Failure." });
}
