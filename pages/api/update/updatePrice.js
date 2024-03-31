const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SIGNED_SLOT,
} = require("../../../utils/constants/info.js");
const { redis } = require("../../../utils/helper/InitRedis.js");
const getPriceOf = require("../../../utils/helper/GetPriceOf.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const results = getPriceOf(token);
    resolve(results);
  });
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const { token } = req.query;
  const results = await PriceOf(token.toLowerCase());

  await redis.set(TOKEN_TO_CACHE[token.toLowerCase()], results[1]);
  await redis.set(TOKEN_TO_SIGNED_SLOT[token.toLowerCase()], "NULL");

  res.status(200).json({
    status: `Updated ${token} Successfully!`,
    price: results[0],
    timestamp: Date.now(),
  });
}
