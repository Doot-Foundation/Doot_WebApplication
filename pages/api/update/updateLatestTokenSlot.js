const {
  TOKEN_TO_CACHE,
  ORACLE_PUBLIC_KEY,
} = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");
const { signatureClient } = require("../../../utils/helper/SignatureClient");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");

export default async function handler(req, res) {
  const { signature, publicKey, token } = req.query;

  const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);
  const toCheck = cachedData.signature;
  var originsVerified = false;
  var isCronOperation = false;

  const authHeader = req.headers.authorization;
  if (authHeader == `Bearer ${process.env.CRON_SECRET}`) {
    originsVerified = true;
    isCronOperation = true;
  } else {
    const compatibleSignatureObject = JSON.parse(signature);

    console.log(toCheck);

    var toVerify = {
      data: toCheck.data.toString(),
      publicKey: toCheck.publicKey.toString(),
      signature: toCheck.signature.toString(),
    };
    toVerify = JSON.stringify(toVerify);

    const verifyBody = {
      data: toVerify,
      signature: compatibleSignatureObject.signature,
      publicKey: compatibleSignatureObject.publicKey,
    };

    console.log(verifyBody);
    originsVerified = signatureClient.verifyMessage(verifyBody);
  }

  console.log(originsVerified);
  if (!originsVerified) res.status(201).json({ status: 0 });
  else {
    if (isCronOperation)
      await appendSignatureToSlot(
        token.toLowerCase(),
        cachedData,
        cachedData.signature,
        ORACLE_PUBLIC_KEY
      );
    else {
      const compatibleSignatureObject = JSON.parse(signature);

      await appendSignatureToSlot(
        token.toLowerCase(),
        cachedData,
        compatibleSignatureObject,
        publicKey
      );
    }
  }
  res.status(201).json({ status: 1 });
}
