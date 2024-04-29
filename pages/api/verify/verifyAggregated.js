const {
  signatureClient,
  mainnetSignatureClient,
} = require("../../../utils/helper/SignatureClient");
const { ORACLE_PUBLIC_KEY } = require("../../../utils/constants/info");

export default function handler(req, res) {
  const { price, signature } = req.query;

  try {
    const verifyBody = {
      signature: signature,
      publicKey: ORACLE_PUBLIC_KEY,
      data: [BigInt(price)],
    };

    console.log(verifyBody);

    const originsVerified = signatureClient.verifyFields(verifyBody);

    if (!originsVerified) res.status(201).json({ status: 0 });
    else res.status(200).json({ status: 1 });
  } catch (err) {
    res.status(200).json({ status: 0 });
    return;
  }
}
