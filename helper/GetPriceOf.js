require("dotenv").config();
const axios = require("axios");

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
} from "./Symbols";

async function getPriceCoinGecko(token) {
  var id = CoinGekoSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data[id].usd;
    return String(Price);
  } catch (error) {
    console.error("Error fetching ETH price coin gecko:", error.message);
    return 0;
  }
}

async function getPriceBinance(token) {
  const id = BinanceSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${id}USDT`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.price;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price binance:", error.message);
    return 0;
  }
}

async function getPriceCMC(token) {
  const id = CMCSymbols[token.toLowerCase()];

  const API_KEY = process.env.CMC_KEY;
  try {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${id}&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": API_KEY,
        },
      }
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.data[id].quote.USD.price;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price cmc:", error.message);
    return 0;
  }
}

async function getPriceCryptoCompare(token) {
  const id = CryptoCompareSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/price?fsym=${id}&tsyms=USD`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.USD;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price crypto compare:", error.message);
    return 0;
  }
}

async function getPriceCoinAPI(token) {
  const id = CoinAPISymbols[token.toLowerCase()];

  try {
    const API_KEY = process.env.COIN_API_KEY;

    const response = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/${id}/USD`,
      {
        headers: {
          "X-CoinAPI-Key": API_KEY,
        },
      }
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.rate;
    return String(Price);
  } catch (error) {
    console.error("Error fetching  price coin api:", error.message);
    return 0;
  }
}

async function getPricePaprika(token) {
  const id = PricePaprikeSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://api.coinpaprika.com/v1/tickers/${id}`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.quotes.USD.price;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price paprika:", error.message);
    return 0;
  }
}

async function getPriceMessari(token) {
  const id = PriceMessariSymbols[token.toLowerCase()];
  try {
    const response = await axios.get(
      `https://data.messari.io/api/v1/assets/${id}/metrics`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.data.market_data.price_usd;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price messari:", error.message);
    return 0;
  }
}

async function getPriceCoinCap(token) {
  const id = CoinCapSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(`https://api.coincap.io/v2/assets/${id}`);
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.data.priceUsd;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price coin cap:", error.message);
    return 0;
  }
}

async function getPriceCoinlore(token) {
  const id = CoinLoreSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://api.coinlore.net/api/ticker/?id=${id}`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const ethPrice = response.data[0].price_usd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching price coin lore:", error.message);
    return 0;
  }
}

async function getPriceCoinRanking(token) {
  const id = CoinRankingSymbols[token.toLowerCase()];

  try {
    const API_KEY = process.env.COIN_RANKING_KEY;
    const response = await axios.get(
      `https://api.coinranking.com/v2/coin/${id}/price`,
      {
        headers: {
          "x-access-token": API_KEY,
        },
      }
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.data.price;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price coin ranking:", error.message);
    return 0;
  }
}

async function getPriceCoinCodex(token) {
  const id = CoinCodexSymbols[token.toLowerCase()];

  try {
    const response = await axios.get(
      `https://coincodex.com/api/coincodex/get_coin/${id}`
    );
    console.log("COINGECKO-RESPONSE :", response);
    const Price = response.data.last_price_usd;
    return String(Price);
  } catch (error) {
    console.error("Error fetching price coin codex:", error.message);
    return 0;
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

function removeOutliers(array, threshold) {
  const median = getMedian(array);
  const mad = getMAD(array);
  const nonOutliers = [];

  for (let i = 0; i < array.length; i++) {
    const deviation = Math.abs(array[i] - median);
    if (deviation <= threshold * mad) {
      nonOutliers.push(array[i]);
    }
  }

  return nonOutliers;
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
  var nextPrice;

  console.log(1.1);

  for (const func of functions) {
    nextPrice = await func(token);
    console.log("Calculating...");
    const floatValue = parseFloat(nextPrice);

    if (nextPrice != 0) priceArray.push(floatValue);
  }

  console.log(1.2);
  priceArray = removeOutliers(priceArray, 2);
  console.log(1.3);
  return priceArray;
}

async function getPriceOf(token) {
  console.log(1);
  const prices = await createPriceArray(token);
  console.log(2);
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
