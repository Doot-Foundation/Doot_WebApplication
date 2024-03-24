const {
  TOKEN_TO_SIGNED_SLOT,
  MINA_SIGNED_MAX_CACHE,
  HISTORICAL_SIGNED_MAX_CACHE,
} = require("../constants/info");
const { redis } = require("./InitRedis");

export default async function appendSignatureToSlot(
  token,
  signature,
  publicKey
) {
  const lastUpdatedSlotInfo = redis.get(TOKEN_TO_SIGNED_SLOT[token]);
  const finalState = lastUpdatedSlotInfo;

  if (lastUpdatedSlotInfo.communitySignatures) {
    finalState.communitySignatures.push(signature);
    finalState.communityPublicKeys.push(publicKey);
  } else {
    finalState["communitySignatures"] = [signature];
    finalState["communityPublicKeys"] = [publicKey];
  }

  await redis.set(TOKEN_TO_SIGNED_SLOT[token], finalState);
}
