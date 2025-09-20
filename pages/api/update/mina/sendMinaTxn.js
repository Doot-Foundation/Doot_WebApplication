const { redis } = require("@/utils/helper/init/InitRedis.js");

const { MINA_CID_CACHE } = require("@/utils/constants/info.js");
const { getToPinIPFSInformation } = require("@/utils/helper/GetMinaInfo.ts");
const sendMinaTxn = require("@/utils/helper/SendMinaTxn");

/// TO CALL THE UPDATE() ON-CHAIN WITH PINNED MINA INFORMATION.
export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    const cachedData = await redis.get(MINA_CID_CACHE);

    if (!cachedData) {
      throw new Error("No Mina CID found in cache");
    }

    const [cid, commitment] = cachedData;
    //RESULTS : [IPFSHASH,COMMITMENT]

    if (!cid || !commitment) {
      throw new Error("Invalid Mina cache data structure");
    }

    console.log(`Fetching IPFS data for CID: ${cid}`);
    const fetchedData = await getToPinIPFSInformation(cid);

    console.log(`Sending Mina transaction with CID: ${cid}, Commitment: ${commitment}`);
    const success = await sendMinaTxn([cid, commitment]);

    if (success) {
      return res.status(200).json({
        status: true,
        message: "Sent Txn On Mina Successfully!",
        data: { cid, commitment }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Txn Failure."
      });
    }
  } catch (error) {
    console.error("Error in sendMinaTxn handler:", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}
