const axios = require("axios");

const { getSignedAPICall } = require("./SignURLCalls");

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

function getTimestamp(data) {
  const date = new Date(data);
  return Math.floor(date.getTime() / 1000);
}

async function getPriceCoinGecko(token) {
  const id = CoinGekoSymbols[token.toLowerCase()];
  const URLCalled = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data[id].usd);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching ETH price coin gecko:", error.message);
    return [0, ""];
  }
}

async function getPriceBinance(token) {
  const id = BinanceSymbols[token.toLowerCase()];
  const URLCalled = `https://api.binance.com/api/v3/ticker/price?symbol=${id}USDT`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.price);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price binance:", error.message);
    return [0, ""];
  }
}

async function getPriceCMC(token) {
  const id = CMCSymbols[token.toLowerCase()];
  const URLCalled = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${id}&convert=USD`;

  const API_KEY = process.env.CMC_KEY;
  try {
    const response = await axios.get(URLCalled, {
      headers: {
        "X-CMC_PRO_API_KEY": API_KEY,
      },
    });
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.data[id].quote.USD.price);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price cmc:", error.message);
    return [0, ""];
  }
}

async function getPriceCryptoCompare(token) {
  const id = CryptoCompareSymbols[token.toLowerCase()];
  const URLCalled = `https://min-api.cryptocompare.com/data/price?fsym=${id}&tsyms=USD`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.USD);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price crypto compare:", error.message);
    return [0, ""];
  }
}

async function getPriceCoinAPI(token) {
  const id = CoinAPISymbols[token.toLowerCase()];
  const API_KEY = process.env.COIN_API_KEY;
  const URLCalled = `https://rest.coinapi.io/v1/exchangerate/${id}/USD`;
  try {
    const response = await axios.get(URLCalled, {
      headers: {
        "X-CoinAPI-Key": API_KEY,
      },
    });
    console.log(response.status);

    const Timestamp = getTimestamp(response.data.time);
    const Price = String(response.data.rate);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching  price coin api:", error.message);
    return [0, ""];
  }
}

async function getPricePaprika(token) {
  const id = PricePaprikeSymbols[token.toLowerCase()];
  const URLCalled = `https://api.coinpaprika.com/v1/tickers/${id}`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.quotes.USD.price);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price paprika:", error.message);
    return [0, ""];
  }
}

async function getPriceMessari(token) {
  const id = PriceMessariSymbols[token.toLowerCase()];
  const URLCalled = `https://data.messari.io/api/v1/assets/${id}/metrics`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.data.market_data.price_usd);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price messari:", error.message);
    return [0, ""];
  }
}

async function getPriceCoinCap(token) {
  const id = CoinCapSymbols[token.toLowerCase()];
  const URLCalled = `https://api.coincap.io/v2/assets/${id}`;
  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.data.priceUsd);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price coin cap:", error.message);
    return [0, ""];
  }
}

async function getPriceCoinlore(token) {
  const id = CoinLoreSymbols[token.toLowerCase()];
  const URLCalled = `https://api.coinlore.net/api/ticker/?id=${id}`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data[0].price_usd);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price coin lore:", error.message);
    return [0, ""];
  }
}

async function getPriceCoinRanking(token) {
  const id = CoinRankingSymbols[token.toLowerCase()];
  const URLCalled = `https://api.coinranking.com/v2/coin/${id}/price`;

  const API_KEY = process.env.COIN_RANKING_KEY;
  try {
    const response = await axios.get(URLCalled, {
      headers: {
        "x-access-token": API_KEY,
      },
    });
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.data.price);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price coin ranking:", error.message);
    return [0, ""];
  }
}

async function getPriceCoinCodex(token) {
  const id = CoinCodexSymbols[token.toLowerCase()];
  const URLCalled = `https://coincodex.com/api/coincodex/get_coin/${id}`;

  try {
    const response = await axios.get(URLCalled);
    console.log(response.status);

    const Timestamp = getTimestamp(response.headers["date"]);
    const Price = String(response.data.last_price_usd);

    const signature = getSignedAPICall(URLCalled, Price, Timestamp, 1);
    return [Price, signature];
  } catch (error) {
    console.error("Error fetching price coin codex:", error.message);
    return [0, ""];
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
async function removeOutliers(array, signatures, threshold) {
  const median = getMedian(array);
  const mad = getMAD(array);

  var nonOutlierPrices = [];
  var nonOutlierSignatures = [];

  for (let i = 0; i < array.length; i++) {
    if (isNaN(Number(array[i]))) continue;

    const deviation = Math.abs(array[i] - median);
    if (deviation <= threshold * mad) {
      nonOutlierPrices.push(array[i]);
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
  var signatureArray = [];
  console.log(1.1);

  for (const func of functions) {
    console.log(`\nCalculating....`);
    const results = await func(token);
    const floatValue = parseFloat(results[0]);

    if (results[0] != "0") {
      priceArray.push(floatValue);
      signatureArray.push(results[1]);
    }
  }

  console.log(priceArray, signatureArray);

  console.log("\n1.2");
  const arrays = await removeOutliers(priceArray, signatureArray, 2);
  console.log("Arrays :", arrays);

  console.log(1.3);
  return arrays;
}

async function getPriceOf(token) {
  console.log(1);
  const results = await createPriceArray(token);
  console.log(2);

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
  return floatValue;
}

module.exports = getPriceOf;
