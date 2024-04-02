const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SIGNED_SLOT,
  SLOT_STATUS_CACHE,
} = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");
const getPriceOf = require("../../../utils/helper/GetPriceOf.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const results = getPriceOf(token);
    resolve(results);
  });
}

async function startFetchAndUpdates(tokens) {
  for (const token of tokens) {
    try {
      console.log("For", token);
      console.log("REACHED 1");
      const results = await PriceOf(token);
      console.log("REACHED 2");
      if (results) {
        await redis.set(TOKEN_TO_CACHE[token], results[1]);
        console.log("REACHED 3");
        await redis.set(TOKEN_TO_SIGNED_SLOT[token], "NULL");
        console.log("REACHED 4");
      }
    } catch (err) {
      console.log("Failed For", token);
    }
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const keys = Object.keys(TOKEN_TO_CACHE);
  await startFetchAndUpdates(keys);

  await redis.set(SLOT_STATUS_CACHE, true);

  res.status(200).json({
    status: `Updated Prices Successfully!`,
    timestamp: Date.now(),
  });
}
