const updateCache = require("../../../helper/CacheHandler.js");
const getPriceOf = require("../../../helper/GetPriceOf.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const value = getPriceOf(token);
    resolve(value);
  });
}

export default async function handler(req, res) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const token = "solana";
  const price = await PriceOf(token);

  updateCache(token, price);

  res.status(200);
}
