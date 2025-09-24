const {
  testnetSignatureClient,
  mainnetSignatureClient,
} = require("@/utils/helper/init/InitSignatureClient");
const { CircuitString } = require("o1js");

export default function handler(req, res) {
  const { price, signature, url, decimals, timestamp } = req.query;
  const DOOT_CALLER = process.env.NEXT_PUBLIC_DOOT_CALLER_PUBLIC_KEY;
  try {
    const fieldURL = BigInt(CircuitString.fromString(url).hash());
    const fieldPrice = BigInt(price);
    const fieldDecimals = BigInt(decimals);
    const fieldTimestamp = BigInt(timestamp);

    const verifyBody = {
      signature: signature,
      publicKey: DOOT_CALLER,
      data: [fieldURL, fieldPrice, fieldDecimals, fieldTimestamp],
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
