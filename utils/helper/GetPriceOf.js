const { callSignAPICall } = require("./CallAndSignAPICalls");

import {
  CoinGekoSymbols,
  BinanceSymbols,
  CMCSymbols,
  CryptoCompareSymbols,
  CoinAPISymbols,
  PricePaprikeSymbols,
  PriceMessariSymbols,
  CoinCapSymbols,
  CoinLoreSymbols,
  CoinRankingSymbols,
  CoinCodexSymbols,
} from "../constants/symbols";

async function getPriceCoinGecko(token) {
  const id = CoinGekoSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
  const resultPath = `data[${id}].usd`;
  /// [Price, Timestamp, Signature]
  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching ETH price coin gecko:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceBinance(token) {
  const id = BinanceSymbols[token.toLowerCase()];
  const apiToCall = `https://api.binance.com/api/v3/ticker/price?symbol=${id}USDT`;
  const resultPath = `data.price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price binance:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCMC(token) {
  const id = CMCSymbols[token.toLowerCase()];
  const apiToCall = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${id}&convert=USD`;
  const header = `X-CMC_PRO_API_KEY`;
  const resultPath = `data.data[${id}].quote.USD.price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, header);
    return results;
  } catch (error) {
    console.error("Error fetching price cmc:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCryptoCompare(token) {
  const id = CryptoCompareSymbols[token.toLowerCase()];
  const apiToCall = `https://min-api.cryptocompare.com/data/price?fsym=${id}&tsyms=USD`;
  const resultPath = `data.USD`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price crypto compare:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCoinAPI(token) {
  const id = CoinAPISymbols[token.toLowerCase()];
  const apiToCall = `https://rest.coinapi.io/v1/exchangerate/${id}/USD`;
  const header = "X-CoinAPI-Key";
  const resultPath = `data.rate`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, header);
    return results;
  } catch (error) {
    console.error("Error fetching  price coin api:", error.message);
    return [0, 0, ""];
  }
}

async function getPricePaprika(token) {
  const id = PricePaprikeSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coinpaprika.com/v1/tickers/${id}`;
  const resultPath = `data.quotes.USD.price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price paprika:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceMessari(token) {
  const id = PriceMessariSymbols[token.toLowerCase()];
  const apiToCall = `https://data.messari.io/api/v1/assets/${id}/metrics`;
  const resultPath = `data.data.market_data.price_usd`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price messari:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCoinCap(token) {
  const id = CoinCapSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coincap.io/v2/assets/${id}`;
  const resultPath = `data.data.priceUsd`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price coin cap:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCoinlore(token) {
  const id = CoinLoreSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coinlore.net/api/ticker/?id=${id}`;
  const resultPath = `data[0].price_usd`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price coin lore:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCoinRanking(token) {
  if (token.toLowerCase() == "mina") return [0, 0, ""];

  const id = CoinRankingSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coinranking.com/v2/coin/${id}/price`;
  const header = "x-access-token";
  const resultPath = `data.data.price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, header);
    return results;
  } catch (error) {
    console.error("Error fetching price coin ranking:", error.message);
    return [0, 0, ""];
  }
}

async function getPriceCoinCodex(token) {
  const id = CoinCodexSymbols[token.toLowerCase()];
  const apiToCall = `https://coincodex.com/api/coincodex/get_coin/${id}`;
  const resultPath = `data.last_price_usd`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error fetching price coin codex:", error.message);
    return [0, 0, ""];
  }
}

function getMedian(array) {
  const sorted = array.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getMAD(array) {
  const median = getMedian(array);
  const deviations = array.map((value) => Math.abs(value - median));
  return getMedian(deviations);
}

// MODIFIED Z-SCORE OUTLIER MECHANISM
async function removeOutliers(array, timestamps, signatures, threshold) {
  const median = getMedian(array);
  const mad = getMAD(array);

  var nonOutlierPrices = [];
  var nonOutlierTimestamps = [];
  var nonOutlierSignatures = [];

  for (let i = 0; i < array.length; i++) {
    if (isNaN(Number(array[i]))) continue;

    const deviation = Math.abs(array[i] - median);
    if (deviation <= threshold * mad) {
      nonOutlierPrices.push(array[i]);
      nonOutlierTimestamps.push(timestamps[i]);
      nonOutlierSignatures.push(signatures[i]);
    }
  }

  return [nonOutlierPrices, nonOutlierSignatures];
}

async function createPriceArray(token) {
  const functions = [
    getPriceBinance,
    getPriceCMC,
    getPriceCoinAPI,
    getPriceCoinCap,
    getPriceCoinGecko,
    getPriceCoinRanking,
    getPriceCoinCodex,
    getPriceCoinlore,
    getPriceCryptoCompare,
    getPriceMessari,
    getPricePaprika,
  ];

  var priceArray = [];
  var timestampArray = [];
  var signatureArray = [];

  for (const func of functions) {
    const results = await func(token);
    const floatValue = parseFloat(results[0]);

    if (results[0] != "0") {
      priceArray.push(floatValue);
      timestampArray.push(results[1]);
      signatureArray.push(results[2]);
    }
  }

  const arrays = await removeOutliers(
    priceArray,
    timestampArray,
    signatureArray,
    2
  );
  return arrays;
}

async function getPriceOf(token) {
  console.log(token);
  const results = await createPriceArray(token);

  console.log(results);

  const prices = results[0];
  let sum = 0;
  let count = 0;
  await new Promise((resolve, reject) => {
    for (const price of prices) {
      sum += price;
      ++count;
    }

    resolve();
  });

  const floatValue = parseFloat(sum / count);
  console.log(floatValue, "\n");
  return floatValue;
}

module.exports = getPriceOf;
