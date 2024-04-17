const {
  TOKEN_TO_SIGNED_SLOT,
  MINA_SIGNED_MAX_CACHE,
  HISTORICAL_SIGNED_MAX_CACHE,
} = require("../constants/info");
const { redis } = require("./InitRedis");

async function appendSignatureToSlot(
  token,
  tokenDetails,
  signature,
  publicKey
) {
  const lastUpdatedSlotInfo = await redis.get(TOKEN_TO_SIGNED_SLOT[token]);
  var finalState = lastUpdatedSlotInfo;

  if (finalState == "NULL") {
    console.log("Running fresh slot.");
    finalState = tokenDetails;
    finalState["community"] = {
      [publicKey]: signature,
    };
    // finalState["communityPublicKeys"] = [publicKey];
  } else {
    const updatedState = finalState.community;
    updatedState[publicKey] = signature;
    finalState.community = updatedState;
  }

  const currentMaxHistoricalCache = await redis.get(
    HISTORICAL_SIGNED_MAX_CACHE
  );
  if (
    Object.keys(finalState.community).length >
    Object.keys(currentMaxHistoricalCache[token].community).length
  ) {
    currentMaxHistoricalCache[token] = finalState;
    await redis.set(HISTORICAL_SIGNED_MAX_CACHE, currentMaxHistoricalCache);
    console.log("UPATED HISTORICAL SIGNED SLOT INFO.");
  }

  const currentMaxMinaCache = await redis.get(MINA_SIGNED_MAX_CACHE);
  if (
    Object.keys(finalState.community).length >
    Object.keys(currentMaxMinaCache[token].community).length
  ) {
    currentMaxMinaCache[token] = finalState;
    await redis.set(MINA_SIGNED_MAX_CACHE, currentMaxMinaCache);
    console.log("UPATED MINA SIGNED SLOT INFO.");
  }

  await redis.set(TOKEN_TO_SIGNED_SLOT[token], finalState);

  console.log(token, "slot signed.");
  return;
}

module.exports = appendSignatureToSlot;
