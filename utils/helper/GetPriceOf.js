const { redis } = require("../helper/init/InitRedis");

const {
  callSignAPICall,
  processFloatString,
} = require("./CallAndSignAPICalls");

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;

const { MULTIPLICATION_FACTOR } = require("../constants/info");
const { testnetSignatureClient } = require("./SignatureClient");

const {
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
  KuCoinSymbols,
  HuobiSymbols,
  ByBitSymbols,
  CexIOSymbols,
  SwapZoneSymbols,
} = require("../constants/symbols");

async function getPriceCoinGecko(token) {
  const id = CoinGekoSymbols[token.toLowerCase()];
  const apiToCall = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
  const resultPath = `data[${id}].usd`;
  /// [Price, Timestamp, Signature, Url]
  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error coin gecko");
    return ["0"];
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
    console.error("Error binance");
    return ["0"];
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
    console.error("Error coin market cap");
    return ["0"];
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
    console.error("Error crypto compare");
    return ["0"];
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
    console.error("Error coin api");
    return ["0"];
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
    console.error("Error price paprika");
    return ["0"];
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
    console.error("Error messari");
    return ["0"];
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
    console.error("Error coin cap");
    return ["0"];
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
    console.error("Error coin lore");
    return ["0"];
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
    console.error("Error coin ranking");
    return ["0"];
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
    console.error("Error coin codex");
    return ["0"];
  }
}
async function getPriceKuCoin(token) {
  const id = KuCoinSymbols[token.toLowerCase()];
  const apiToCall = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${id}-USDT`;
  const resultPath = `data.data.price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error kucoin");
    return ["0"];
  }
}
async function getPriceHuobi(token) {
  const id = HuobiSymbols[token.toLowerCase()];
  const apiToCall = `https://api.huobi.pro/market/history/trade?symbol=${id}usdt&size=1`;
  const resultPath = `data.data[0].data[0].price`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error huobi");
    return ["0"];
  }
}
async function getPriceByBit(token) {
  const id = ByBitSymbols[token.toLowerCase()];
  const apiToCall = `https://api.bybit.com/derivatives/v3/public/tickers?symbol=${id}USDT`;
  const resultPath = `data.result.list[0].prevPrice1h`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error bybit");
    return ["0"];
  }
}

async function getPriceCexIO(token) {
  const id = CexIOSymbols[token.toLowerCase()];
  const apiToCall = `https://cex.io/api/last_price/${id}/USD`;
  const resultPath = `data.lprice`;

  try {
    const results = await callSignAPICall(apiToCall, resultPath, "");
    return results;
  } catch (error) {
    console.error("Error cexio");
    return ["0"];
  }
}

/// MULTIPLIED BY 1000 because of doge
async function getPriceSwapZone(token) {
  const id = SwapZoneSymbols[token.toLowerCase()];
  const apiToCall = `https://api.swapzone.io/v1/exchange/get-rate?from=${id}&to=usdc&amount=1000`;
  const resultPath = `data.amountTo`;
  const header = "x-api-key";

  try {
    const results = await callSignAPICall(apiToCall, resultPath, header);
    return results;
  } catch (error) {
    console.error("Error swapzone");
    return ["0"];
  }
}

function getMedian(array) {
  const sorted = array.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

// Mean Absolute Deviation
function getMAD(array) {
  const median = getMedian(array);
  const deviations = array.map((value) => Math.abs(value - median));
  return getMedian(deviations);
}

async function removeOutliers(prices, timestamps, signatures, urls, threshold) {
  const median = getMedian(prices);
  const mad = getMAD(prices);

  const nonOutlierPrices = [];
  const nonOutlierTimestamps = [];
  const nonOutlierSignatures = [];
  const nonOutlierUrls = [];

  for (let i = 0; i < prices.length; i++) {
    if (isNaN(Number(prices[i]))) continue;

    const deviation = Math.abs(prices[i] - median);
    if (deviation <= threshold * mad) {
      nonOutlierPrices.push(prices[i]);
      nonOutlierTimestamps.push(timestamps[i]);
      nonOutlierSignatures.push(signatures[i]);
      nonOutlierUrls.push(urls[i]);
    }
  }

  console.log(
    "Data Points Considered :",
    nonOutlierPrices.length + "/" + prices.length
  );

  return [
    nonOutlierPrices,
    nonOutlierSignatures,
    nonOutlierTimestamps,
    nonOutlierUrls,
  ];
}

async function createAssetInfoArray(token) {
  const functions = [
    getPriceBinance,
    getPriceCoinCap,
    getPriceCoinGecko,
    getPriceCoinCodex,
    getPriceCoinlore,
    getPriceCryptoCompare,
    getPriceMessari,
    getPricePaprika,
    getPriceKuCoin,
    getPriceHuobi,
    getPriceByBit,
    getPriceCexIO,
    getPriceSwapZone,
    // getPriceCMC,
    // getPriceCoinAPI,
    // getPriceCoinRanking,
  ];

  let priceArray = [];
  let timestampArray = [];
  let signatureArray = [];
  let urlArray = [];

  for (const func of functions) {
    const results = await func(token);
    const floatValue = parseFloat(results[0]);

    // Check if the function call was successful.
    if (results[0] !== 0) {
      priceArray.push(floatValue);
      timestampArray.push(results[1]);
      signatureArray.push(results[2]);
      urlArray.push(results[3]);
    }
  }

  // REMOVE OUTLIERS(PRICES) USING MAD AT 2.5 THRESHOLD.
  const arrays = await removeOutliers(
    priceArray,
    timestampArray,
    signatureArray,
    urlArray,
    2.5
  );
  return arrays;
}

async function getPriceOf(token) {
  const cleanedData = await createAssetInfoArray(token);
  const prices = cleanedData[0];
  console.log(prices);

  let sum = 0;
  let count = 0;

  await new Promise((resolve, reject) => {
    for (const price of prices) {
      sum += price;
      ++count;
    }

    resolve();
  });

  const meanPrice = parseFloat(sum / count);
  const aggregatedAt = Date.now();
  const processedMeanPrice = processFloatString(meanPrice);

  const signedPrice = testnetSignatureClient.signFields(
    [BigInt(processedMeanPrice)],
    DEPLOYER_KEY
  );

  console.log("Mean :", meanPrice);
  console.log("Processed Mean :", processedMeanPrice);
  console.log("Signature over processed mean :", signedPrice.signature);

  /// PURPOSE - CONVERT A BIGINT DATA TO STRING DATA SINCE BIGINT IS NOT PERMITTED OVER API CALLS.
  const jsonCompatibleSignature = {};
  jsonCompatibleSignature["signature"] = signedPrice.signature;
  jsonCompatibleSignature["publicKey"] = signedPrice.publicKey;
  jsonCompatibleSignature["data"] = signedPrice.data[0].toString();

  const assetCacheObject = {
    price: processedMeanPrice,
    floatingPrice: meanPrice,
    decimals: MULTIPLICATION_FACTOR,
    aggregationTimestamp: aggregatedAt,
    signature: jsonCompatibleSignature,
    prices_returned: cleanedData[0],
    signatures: cleanedData[1],
    timestamps: cleanedData[2],
    urls: cleanedData[3],
  };

  return [meanPrice, assetCacheObject];
}

module.exports = getPriceOf;
