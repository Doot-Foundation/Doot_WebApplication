const { signatureClient } = require("../../../utils/helper/SignatureClient");
const { ORACLE_PUBLIC_KEY } = require("../../../utils/constants/info");

const { CircuitString } = require("o1js");

export default function handler(req, res) {
  const { price, signature, url, decimals, timestamp } = req.query;

  try {
    const fieldURL = BigInt(CircuitString.fromString(url).hash());
    const fieldPrice = BigInt(price);
    const fieldDecimals = BigInt(decimals);
    const fieldTimestamp = BigInt(timestamp);

    const verifyBody = {
      signature: signature,
      publicKey: ORACLE_PUBLIC_KEY,
      data: [fieldURL, fieldPrice, fieldDecimals, fieldTimestamp],
    };

    console.log(verifyBody);

    const originsVerified = signatureClient.verifyFields(verifyBody);
    if (!originsVerified) res.status(201).json({ status: 0 });
    else res.status(200).json({ status: 1 });
  } catch (err) {
    res.status(200).json({ status: 0 });
  }

  res.status(200).json({ status: 0 });
  return;
}
