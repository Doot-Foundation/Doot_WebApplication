const getPriceOf = require("../../helper/GetPriceOf.js");

async function PriceOf(token) {
  return new Promise((resolve) => {
    const value = getPriceOf(token);
    resolve(value);
  });
}

export default async function handler(req, res) {
  const { token } = req.query;
  console.log(token);

  const price = await PriceOf(token);
  console.log(price);

  res.status(200).json({
    token: token,
    timestamp: Date.now(),
    price: price,
  });
}
