const sendOffchainStateTxn = require("../../../../utils/helper/SendOffchainStateSettlementTxn");

/// AFTER NORMAL TXN EXECUTES, CALL THE SETTLE OFFCHAINSTATE PROOF.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json("Unauthorized");
  }

  const success = await sendOffchainStateTxn();

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
