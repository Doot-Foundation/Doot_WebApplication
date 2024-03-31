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

  const compatibleSignatureObject = JSON.parse(signature);

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

  originsVerified = signatureClient.verifyMessage(verifyBody);

  if (!originsVerified) res.status(201).json({ status: 0 });

  await appendSignatureToSlot(
    token.toLowerCase(),
    cachedData,
    compatibleSignatureObject,
    publicKey
  );
  res.status(201).json({ status: 1 });
}
