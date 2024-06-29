const { redis } = require("../../../utils/helper/InitRedis.js");

const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SIGNED_SLOT,
  TOKEN_TO_GRAPH_DATA,
  HISTORICAL_CACHE,
  HISTORICAL_SIGNED_MAX_CACHE,
  MINA_CACHE,
  MINA_SIGNED_MAX_CACHE,
  ORACLE_PUBLIC_KEY,
} = require("../../../utils/constants/info.js");

const {
  pinHistoricalObject,
} = require("../../../utils/helper/PinHistorical.js");

import pinMinaObject from "../../../utils/helper/PinMinaObject.ts";

const getPriceOf = require("../../../utils/helper/GetPriceOf.js");

const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot.js");

async function PriceOf(key) {
  return new Promise((resolve) => {
    const results = getPriceOf(key);
    resolve(results);
  });
}

async function resetTokenCache(keys) {
  for (const key of keys) {
    console.log(key);
    const results = await PriceOf(key);

    await redis.set(TOKEN_TO_CACHE[key], results[1]);
    await redis.set(TOKEN_TO_SIGNED_SLOT[key], "NULL");
  }
}

async function resetHistoricalCache(keys) {
  var finalObject = {};

  for (const key of keys) {
    const CACHED_DATA = await redis.get(TOKEN_TO_CACHE[key]);
    finalObject[key] = CACHED_DATA;
  }

  const updatedCID = await pinHistoricalObject("NULL", finalObject);
  await redis.set(HISTORICAL_CACHE, updatedCID);
}

async function resetHistoricalSignedCache(keys) {
  var finalObj = {};

  for (const key of keys) {
    finalObj[key] = { community: {} };
  }
  await redis.set(HISTORICAL_SIGNED_MAX_CACHE, finalObj);
}

async function resetMinaCache(keys) {
  const finalObj = {};

  for (const key of keys) {
    const CACHED_DATA = await redis.get(TOKEN_TO_CACHE[key]);
    finalObj[key] = CACHED_DATA;
  }

  const updatedCID = await pinMinaObject(finalObj, "NULL");
  console.log(updatedCID);
  await redis.set(MINA_CACHE, updatedCID);
}

async function resetMinaSignedCache(keys) {
  var finalObj = {};

  for (const key of keys) {
    finalObj[key] = { community: {} };
  }

  await redis.set(MINA_SIGNED_MAX_CACHE, finalObj);
}

async function resetSlots(keys) {
  for (const key of keys) {
    const CACHED_DATA = await redis.get(TOKEN_TO_CACHE[key]);

    await appendSignatureToSlot(
      key,
      CACHED_DATA,
      CACHED_DATA.signature,
      ORACLE_PUBLIC_KEY
    );
  }
}

async function resetGraphCache(keys) {
  for (const key of keys) {
    await redis.set(TOKEN_TO_GRAPH_DATA[key], {
      graph_data: [],
      max_price: 0,
      min_price: 0,
      percentage_change: "0",
    });

    console.log("Added graph slot for", key);
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const keys = Object.keys(TOKEN_TO_CACHE);

  await resetTokenCache(keys);
  await resetHistoricalCache(keys);
  await resetHistoricalSignedCache(keys);
  await resetMinaCache(keys);
  await resetMinaSignedCache(keys);
  await resetSlots(keys);
  await resetGraphCache(keys);

  // AFTER ALL IS DONE YOU NEED TO CALL UPDATEHISTORICAL TO POPULATE THE HISTORICAL.HISTORICAL

  console.log("FINISHED JOB!!");

  res.status(200).json("Init Cache!");
}
