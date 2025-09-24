const {
  testnetSignatureClient,
  mainnetSignatureClient,
} = require("@/utils/helper/init/InitSignatureClient");

export default function handler(req, res) {
  const { price, signature } = req.query;
  const DOOT_CALLER = process.env.NEXT_PUBLIC_DOOT_CALLER_PUBLIC_KEY;

  try {
    const verifyBody = {
      signature: signature,
      publicKey: DOOT_CALLER,
      data: [BigInt(price)],
    };

    let originsVerified = testnetSignatureClient.verifyFields(verifyBody);
    if (!originsVerified) {
      originsVerified = mainnetSignatureClient.verifyFields(verifyBody);
    }

    if (!originsVerified) return res.status(201).json({ status: 0 });
    else return res.status(200).json({ status: 1 });
  } catch (err) {
    return res.status(200).json({ status: 0 });
  }
}
