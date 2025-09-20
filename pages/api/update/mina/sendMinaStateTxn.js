const sendOffchainStateTxn = require("@/utils/helper/SendOffchainStateSettlementTxn");

/// AFTER NORMAL TXN EXECUTES, CALL THE SETTLE OFFCHAINSTATE PROOF.
export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    console.log("Sending offchain state settlement transaction...");
    const success = await sendOffchainStateTxn();

    if (success) {
      console.log("Offchain state settlement successful");
      return res.status(200).json({
        status: true,
        message: "Settled state on Doot smart contract successfully.",
      });
    } else {
      console.log("Offchain state settlement failed");
      return res.status(500).json({
        status: false,
        message: "Transaction failed."
      });
    }
  } catch (error) {
    console.error("Error in sendMinaStateTxn handler:", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}
