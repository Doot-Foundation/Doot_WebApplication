const settleOffchainStateTxn = require("../../../utils/helper/SendOffchainStateSettlementTxn");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const success = await settleOffchainStateTxn();

  if (success)
    return res.status(200).json({
      status: true,
      message: "Settled stae on Doot smart contract successfully.",
    });
  else
    return res
      .status(200)
      .json({ status: false, message: "Transaction failed." });
}
