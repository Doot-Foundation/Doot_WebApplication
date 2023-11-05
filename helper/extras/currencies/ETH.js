require("dotenv").config();
const axios = require("axios");

async function getEthPriceCoinGecko() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const ethPrice = response.data.ethereum.usd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price cg:", error.message);
    return 0;
  }
}

async function getEthPriceBinance() {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT"
    );
    const ethPrice = response.data.price;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price bin:", error.message);
    return 0;
  }
}

async function getEthPriceCMC() {
  const API_KEY = process.env.CMC_KEY;
  try {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": API_KEY,
        },
      }
    );
    const ethPrice = response.data.data.ETH.quote.USD.price;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price cmc:", error.message);
    return 0;
  }
}

async function getEthPriceCryptoCompare() {
  try {
    const response = await axios.get(
      "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
    );
    const ethPrice = response.data.USD;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price cc:", error.message);
    return 0;
  }
}

async function getEthPriceCoinAPI() {
  try {
    const API_KEY = process.env.COIN_API_KEY;

    const response = await axios.get(
      "https://rest.coinapi.io/v1/exchangerate/ETH/USD",
      {
        headers: {
          "X-CoinAPI-Key": API_KEY,
        },
      }
    );
    const ethPrice = response.data.rate;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price capi:", error.message);
    return 0;
  }
}

async function getEthPricePaprika() {
  try {
    const response = await axios.get(
      "https://api.coinpaprika.com/v1/tickers/eth-ethereum"
    );
    const ethPrice = response.data.quotes.USD.price;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price paprika:", error.message);
    return 0;
  }
}

async function getEthPriceMessari() {
  try {
    const response = await axios.get(
      "https://data.messari.io/api/v1/assets/ethereum/metrics"
    );
    const ethPrice = response.data.data.market_data.price_usd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price from Messari:", error.message);
    return 0;
  }
}

async function getEthPriceCoinCap() {
  try {
    const response = await axios.get(
      "https://api.coincap.io/v2/assets/ethereum"
    );
    const ethPrice = response.data.data.priceUsd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price from CoinCap:", error.message);
    return 0;
  }
}

async function getEthPriceCoinlore() {
  try {
    const response = await axios.get(
      "https://api.coinlore.net/api/ticker/?id=80"
    );
    const ethPrice = response.data[0].price_usd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price from Coinlore:", error.message);
    return 0;
  }
}

async function getEthPriceCoinRanking() {
  try {
    const API_KEY = process.env.COIN_RANKING_KEY;
    const response = await axios.get(
      "https://api.coinranking.com/v2/coin/razxDUgYGNAdQ/price",
      {
        headers: {
          "x-access-token": API_KEY,
        },
      }
    );
    const ethPrice = response.data.data.price;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price from CoinRanking:", error.message);
    return 0;
  }
}

async function getEthPriceCoincodex() {
  try {
    const response = await axios.get(
      "https://coincodex.com/api/coincodex/get_coin/eth"
    );
    const ethPrice = response.data.last_price_usd;
    return String(ethPrice);
  } catch (error) {
    console.error("Error fetching ETH price from Coincodex:", error.message);
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

async function createPriceArray() {
  const functions = [
    getEthPriceBinance,
    getEthPriceCMC,
    getEthPriceCoinAPI,
    getEthPriceCoinCap,
    getEthPriceCoinGecko,
    getEthPriceCoinRanking,
    getEthPriceCoincodex,
    getEthPriceCoinlore,
    getEthPriceCryptoCompare,
    getEthPriceMessari,
    getEthPricePaprika,
  ];

  var priceArray = [];
  var nextPrice;

  for (const func of functions) {
    nextPrice = await func();
    const floatValue = parseFloat(nextPrice);

    if (nextPrice != 0) priceArray.push(floatValue);
  }

  priceArray = removeOutliers(priceArray, 2);
  return priceArray;
}

async function getPriceOfETH() {
  const prices = await createPriceArray();
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

module.exports = getPriceOfETH;
