const getPriceOfETH = require("../../../helper/extras/currencies/ETH.js/index.js");

// TODO - Turn the process into a general solution so that the user just sends the token name.

async function PriceOfETH() {
  return new Promise((resolve) => {
    const value = getPriceOfETH();
    resolve(value);
  });
}

export default async function handler(req, res) {
  const authHeader = req.headers["authorization"];

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false });
  } else {
    try {
      const price = await PriceOfETH();
      console.log(price);
      res.status(200).json({
        token: "ETH",
        timestamp: Date.now(),
        price: price,
      });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
}
