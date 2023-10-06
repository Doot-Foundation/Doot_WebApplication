// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const getPriceOfETH = require("../../helper/currencies/ETH.js");

async function PriceOfETH() {
  return new Promise((resolve) => {
    const value = getPriceOfETH();
    resolve(value);
  });
}

export default async function handler(req, res) {
  if (req.method == "GET") {
    const price = await PriceOfETH();
    console.log(price);
    res.status(200).json({ token: "ETH", timestamp: Date.now(), price: price });
  }
}
