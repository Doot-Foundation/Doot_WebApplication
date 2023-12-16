const getPriceOf = require("../../../../utils/GetPriceOf.js");
const updateCache = require("../../../../utils/CacheHandler.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const value = getPriceOf(token);
    resolve(value);
  });
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const token = "bitcoin";
  const price = await PriceOf(token);

  updateCache(token, price);

  res.status(200).json({ status: "Success" });
}
