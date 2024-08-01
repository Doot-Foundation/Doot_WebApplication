const { redis } = require("../../../utils/helper/init/InitRedis");

const { TOKEN_TO_CACHE } = require("../../../utils/constants/info");
const {
  testnetSignatureClient,
  mainnetSignatureClient,
} = require("../../../utils/helper/SignatureClient");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");

export default async function handler(req, res) {
  const { signature, token } = req.query;

  // console.log(signature, publicKey, token);

  const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);
  const toCheck = cachedData.signature;
  var originsVerified = false;

  const compatibleReceivedSignatureObj = JSON.parse(signature);

  var toVerify = {
    data: toCheck.data.toString(),
    publicKey: toCheck.publicKey.toString(),
    signature: toCheck.signature.toString(),
  };
  toVerify = JSON.stringify(toVerify);

  const verifyBody = {
    data: toVerify,
    signature: compatibleReceivedSignatureObj.signature,
    publicKey: compatibleReceivedSignatureObj.publicKey,
  };

  originsVerified = testnetSignatureClient.verifyMessage(verifyBody);
  if (!originsVerified) {
    const mainnetOriginsVerified =
      mainnetSignatureClient.verifyMessage(verifyBody);
    if (!mainnetOriginsVerified) {
      res
        .status(201)
        .json({
          status: false,
          message: "ERR! Unable to verify signature origins.",
        });
      return;
    }
  }

  await appendSignatureToSlot(
    token.toLowerCase(),
    cachedData,
    compatibleReceivedSignatureObj,
    compatibleReceivedSignatureObj.publicKey
  );

  console.log(publicKey, "joined", token, "consensus.", "\n");
  res
    .status(201)
    .json({ status: true, message: "Successfully joined consensus." });
}
