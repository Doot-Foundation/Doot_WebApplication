const {
  TOKEN_TO_CACHE,
  ORACLE_PUBLIC_KEY,
} = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");
const { signatureClient } = require("../../../utils/helper/SignatureClient");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");
const { PublicKey, Signature } = require("o1js");

export default async function handler(req, res) {
  const { signature, publicKey, token } = req.body;

  const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);
  const toCheck = cachedData.signature;
  var originsVerified = false;
  var isCronOperation = false;

  const authHeader = req.headers.authorization;
  if (authHeader == `Bearer ${process.env.CRON_SECRET}`) {
    originsVerified = true;
    isCronOperation = true;
  } else {
    const verifyBody = {
      signature: signature,
      publicKey: publicKey,
      data: [
        BigInt(toCheck.data),
        PublicKey.fromBase58(toCheck.publicKey),
        Signature.fromBase58(toCheck.signature),
      ],
    };
    originsVerified = signatureClient.verifyFields(verifyBody);
  }

  if (!originsVerified) res.status(201).json({ status: 0 });
  else {
    if (isCronOperation)
      await appendSignatureToSlot(
        token.toLowerCase(),
        cachedData,
        cachedData.signature,
        ORACLE_PUBLIC_KEY
      );
    else
      await appendSignatureToSlot(
        token.toLowerCase(),
        cachedData,
        signature,
        publicKey
      );
  }
  res.status(201).json({ status: 1 });
}
