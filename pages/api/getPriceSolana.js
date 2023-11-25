const getPriceOf = require("../../helper/GetPriceOf.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const value = getPriceOf(token);
    resolve(value);
  });
}

export default async function handler(req, res) {
  const token = "Solana";
  const price = await PriceOf(token);

  res.status(200).json({
    token: token,
    timestamp: Date.now(),
    price: price,
  });
}
