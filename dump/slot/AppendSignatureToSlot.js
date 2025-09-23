const {
  TOKEN_TO_SIGNED_SLOT,
  MINA_MAX_SIGNED_SLOT_CACHE,
  HISTORICAL_MAX_SIGNED_SLOT_CACHE,
} = require("@/utils/constants/info");
const { redis } = require("@/utils/helper/init/InitRedis");

async function appendSignatureToSlot(
  token,
  tokenDetails,
  signature,
  publicKey
) {
  try {
    // Fetch all redis data in parallel
    const [lastUpdatedSlotInfo, currentMaxHistoricalSlot, currentMaxMinaSlot] =
      await Promise.all([
        redis.get(TOKEN_TO_SIGNED_SLOT[token]),
        redis.get(HISTORICAL_MAX_SIGNED_SLOT_CACHE),
        redis.get(MINA_MAX_SIGNED_SLOT_CACHE),
      ]);

    let finalState;
    if (lastUpdatedSlotInfo === "NULL") {
      console.log(`Running fresh slot for ${token}.`);
      finalState = {
        ...tokenDetails,
        community: { [publicKey]: signature },
      };
    } else {
      console.log(`Updating existing slot for ${token}.`);
      finalState = {
        ...lastUpdatedSlotInfo,
        community: {
          ...lastUpdatedSlotInfo.community,
          [publicKey]: signature,
        },
      };
    }

    // Cache the endorsement count
    const currentEndorsements = Object.keys(finalState.community).length;
    const updates = [];

    // Prepare updates if needed
    if (
      currentEndorsements >
      Object.keys(currentMaxHistoricalSlot[token].community).length
    ) {
      currentMaxHistoricalSlot[token] = finalState;
      updates.push(
        redis
          .set(HISTORICAL_MAX_SIGNED_SLOT_CACHE, currentMaxHistoricalSlot)
          .then(() => console.log("UPDATED HISTORICAL MAX SIGNED SLOT INFO."))
      );
    }

    if (
      currentEndorsements >
      Object.keys(currentMaxMinaSlot[token].community).length
    ) {
      currentMaxMinaSlot[token] = finalState;
      updates.push(
        redis
          .set(MINA_MAX_SIGNED_SLOT_CACHE, currentMaxMinaSlot)
          .then(() => console.log("UPDATED MINA MAX SIGNED SLOT INFO."))
      );
    }

    // Add current slot update
    updates.push(
      redis
        .set(TOKEN_TO_SIGNED_SLOT[token], finalState)
        .then(() => console.log(publicKey, "joined", token, "consensus.", "\n"))
    );

    // Execute all updates in parallel
    await Promise.all(updates);
  } catch (error) {
    console.error(
      "appendSignatureToSlot error:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = appendSignatureToSlot;
