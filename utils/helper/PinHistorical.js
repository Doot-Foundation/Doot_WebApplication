const axios = require("axios");

const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.PINATA_GATEWAY;

export default async function pinHistoricalObject(previousCID, latestPrices) {
  // const previousCID = await getHistoricalCache();

  let isFirst;
  let toUploadObject;

  if (previousCID == "null") {
    isFirst = true;
    toUploadObject = {
      latest: {
        timestamp: Date.now(),
        prices: latestPrices,
      },
      historical: {},
    };
  } else {
    isFirst = false;

    const res = await axios.get(`https://${GATEWAY}/ipfs/${previousCID}`);
    const previousObject = res.data;
    const previousTimestamp = previousObject.latest.timestamp;
    const previousPrices = previousObject.latest.prices;
    const previousHistorical = previousObject.historical;

    const updatedHistorical = previousHistorical;
    updatedHistorical[previousTimestamp] = previousPrices;

    toUploadObject = {
      latest: {
        timestamp: Date.now(),
        prices: latestPrices,
      },
      historical: updatedHistorical,
    };
  }

  const minimalExample = {
    latest: {
      timestamp: "234432904",
      prices: {
        mina: {
          price: "459724021176787",
          decimals: "10",
          signature: {
            signature:
              "7mXQm1biXBP5iTEAYR1nECAAHiJ1CARkJJzjxZrw8y5k8J7jGUtwFGYzf7xJwZAUFCA1gZRsEDqw6v5iGz74x241DeCHom3a",
            publicKey:
              "B62qrbTTZmzf13czouLTatRA5mPmJXyQETa4JyWxNn4BrAANBDAhhHX",
            data: "459724021176787",
          },
          urls: [
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD",
            "https://rest.coinapi.io/v1/exchangerate/BTC/USD",
            "https://api.coincap.io/v2/assets/bitcoin",
            "https://api.coinlore.net/api/ticker/?id=90",
            "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD",
            "https://data.messari.io/api/v1/assets/bitcoin/metrics",
          ],
          prices_returned: [
            "45968.51676052421",
            "45970.726141344254",
            "45977.10982921453",
            "45973.22",
            "45974.2",
            "45970.63997498975",
          ],
          timestamps: [
            "1704855658",
            "1704855658",
            "1704855659",
            "1704855662",
            "1704855663",
            "1704855665",
          ],
          signatures: [
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
            {
              signature: "as",
              publicKey: "0assa",
              data: "21340",
            },
          ],
        },
      },
    },
    historical: {},
  };

  console.log(JSON.stringify(minimalExample));

  return "asd";
}
