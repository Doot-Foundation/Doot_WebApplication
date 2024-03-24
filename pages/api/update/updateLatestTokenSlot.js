const { TOKEN_TO_CACHE } = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");
const { signatureClient } = require("../../../utils/helper/SignatureClient");
const { PublicKey, Signature } = require("o1js");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");

export default async function handler(req, res) {
  const { signature, publicKey, token } = req.body;

  const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);
  const toCheck = cachedData.signature;

  const verifyBody = {
    signature: signature,
    publicKey: publicKey,
    data: [
      BigInt(toCheck.data),
      PublicKey.fromBase58(toCheck.publicKey),
      Signature.fromBase58(toCheck.signature),
    ],
  };

  console.log(verifyBody);

  const originsVerified = signatureClient.verifyFields(verifyBody);
  if (!originsVerified) res.status(201).json({ status: 0 });
  else appendSignatureToSlot(token.toLowerCase(), signature, publicKey);
}
