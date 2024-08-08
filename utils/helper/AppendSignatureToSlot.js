const {
  TOKEN_TO_SIGNED_SLOT,
  MINA_MAX_SIGNED_SLOT_CACHE,
  HISTORICAL_MAX_SIGNED_SLOT_CACHE,
} = require("../constants/info");
const { redis } = require("./init/InitRedis");

async function appendSignatureToSlot(
  token,
  tokenDetails,
  signature,
  publicKey
) {
  const lastUpdatedSlotInfo = await redis.get(TOKEN_TO_SIGNED_SLOT[token]);
  let finalState = lastUpdatedSlotInfo;

  // Bootstrap a new slot.
  if (finalState == "NULL") {
    console.log(`Running fresh slot for ${token}.`);
    finalState = tokenDetails;
    finalState["community"] = {
      [publicKey]: signature,
    };
  } else {
    // Endorse an existing slot.
    console.log(`Updaing existing slot for ${token}.`);

    const updatedState = finalState.community;
    updatedState[publicKey] = signature;
    finalState.community = updatedState;
  }

  //IF THE CURRENT SLOT HAS MORE ENDORSEMENT THAN ANY OTHER SLOTS IN THE PAST 30 MINUTES IT REPLACES THE LEAD.
  const currentMaxHistoricalSlot = await redis.get(
    HISTORICAL_MAX_SIGNED_SLOT_CACHE
  );
  if (
    Object.keys(finalState.community).length >
    Object.keys(currentMaxHistoricalSlot[token].community).length
  ) {
    currentMaxHistoricalSlot[token] = finalState;
    await redis.set(HISTORICAL_MAX_SIGNED_SLOT_CACHE, currentMaxHistoricalSlot);
    console.log("UPDATED HISTORICAL MAX SIGNED SLOT INFO.");
  }

  //IF THE CURRENT SLOT HAS MORE ENDORSEMENT THAN ANY OTHER SLOTS IN THE PAST 2HRS IT REPLACES THE LEAD.
  const currentMaxMinaSlot = await redis.get(MINA_MAX_SIGNED_SLOT_CACHE);
  if (
    Object.keys(finalState.community).length >
    Object.keys(currentMaxMinaSlot[token].community).length
  ) {
    currentMaxMinaSlot[token] = finalState;
    await redis.set(MINA_MAX_SIGNED_SLOT_CACHE, currentMaxMinaSlot);
    console.log("UPDATED MINA MAX SIGNED SLOT INFO.");
  }

  await redis.set(TOKEN_TO_SIGNED_SLOT[token], finalState);

  console.log(publicKey, "joined", token, "consensus.", "\n");
  return;
}

module.exports = appendSignatureToSlot;
