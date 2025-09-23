const {
  callSignAPICall,
  processFloatString,
} = require("@/utils/helper/CallAndSignAPICalls");
const { MULTIPLICATION_FACTOR } = require("@/utils/constants/info");
const {
  testnetSignatureClient,
} = require("@/utils/helper/init/InitSignatureClient");
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
  MEXCSymbols,
  GateIOSymbols,
  OKXSymbols,
  PoloniexSymbols,
  BTSESymbols,
} = require("@/utils/constants/symbols");

const DOOT_CALLER_KEY = process.env.DOOT_CALLER_KEY;

// Unified error handler for API calls
async function safeApiCall(apiName, callFn) {
  try {
    return await callFn();
  } catch (error) {
    console.error(`Error ${apiName}:`, error.message || "Unknown error");
    return ["0"];
  }
}

// Statistical helper functions
function getMedian(array) {
  const sorted = array.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getMAD(array) {
  const median = getMedian(array);
  return getMedian(array.map((value) => Math.abs(value - median)));
}

// API Call Functions
async function getPriceCoinGecko(token) {
  const id = CoinGekoSymbols[token.toLowerCase()];
  return safeApiCall("coin gecko", () =>
    callSignAPICall(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      `data[${id}].usd`,
      ""
    )
  );
}

async function getPriceBinance(token) {
  const id = BinanceSymbols[token.toLowerCase()];
  return safeApiCall("binance", () =>
    callSignAPICall(
      `https://api.binance.com/api/v3/ticker/price?symbol=${id}USDT`,
      `data.price`,
      ""
    )
  );
}

async function getPriceCMC(token) {
  const id = CMCSymbols[token.toLowerCase()];
  return safeApiCall("coin market cap", () =>
    callSignAPICall(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${id}&convert=USD`,
      `data.data[${id}].quote.USD.price`,
      `X-CMC_PRO_API_KEY`
    )
  );
}

async function getPriceCryptoCompare(token) {
  const id = CryptoCompareSymbols[token.toLowerCase()];
  return safeApiCall("crypto compare", () =>
    callSignAPICall(
      `https://min-api.cryptocompare.com/data/price?fsym=${id}&tsyms=USD`,
      `data.USD`,
      ""
    )
  );
}

async function getPriceCoinAPI(token) {
  const id = CoinAPISymbols[token.toLowerCase()];
  return safeApiCall("coin api", () =>
    callSignAPICall(
      `https://rest.coinapi.io/v1/exchangerate/${id}/USD`,
      `data.rate`,
      "X-CoinAPI-Key"
    )
  );
}

async function getPricePaprika(token) {
  const id = PricePaprikeSymbols[token.toLowerCase()];
  return safeApiCall("price paprika", () =>
    callSignAPICall(
      `https://api.coinpaprika.com/v1/tickers/${id}`,
      `data.quotes.USD.price`,
      ""
    )
  );
}

async function getPriceMessari(token) {
  const id = PriceMessariSymbols[token.toLowerCase()];
  return safeApiCall("messari", () =>
    callSignAPICall(
      `https://data.messari.io/api/v1/assets/${id}/metrics`,
      `data.data.market_data.price_usd`,
      "x-messari-api-key"
    )
  );
}

async function getPriceCoinCap(token) {
  const id = CoinCapSymbols[token.toLowerCase()];
  return safeApiCall("coin cap", () =>
    callSignAPICall(
      `https://api.coincap.io/v2/assets/${id}`,
      `data.data.priceUsd`,
      ""
    )
  );
}

async function getPriceCoinlore(token) {
  const id = CoinLoreSymbols[token.toLowerCase()];
  return safeApiCall("coin lore", () =>
    callSignAPICall(
      `https://api.coinlore.net/api/ticker/?id=${id}`,
      `data[0].price_usd`,
      ""
    )
  );
}

async function getPriceCoinRanking(token) {
  if (token.toLowerCase() === "mina") return [0, 0, ""];

  const id = CoinRankingSymbols[token.toLowerCase()];
  return safeApiCall("coin ranking", () =>
    callSignAPICall(
      `https://api.coinranking.com/v2/coin/${id}/price`,
      `data.data.price`,
      "x-access-token"
    )
  );
}

async function getPriceCoinCodex(token) {
  const id = CoinCodexSymbols[token.toLowerCase()];
  return safeApiCall("coin codex", () =>
    callSignAPICall(
      `https://coincodex.com/api/coincodex/get_coin/${id}`,
      `data.last_price_usd`,
      ""
    )
  );
}

async function getPriceKuCoin(token) {
  const id = KuCoinSymbols[token.toLowerCase()];
  return safeApiCall("kucoin", () =>
    callSignAPICall(
      `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${id}-USDT`,
      `data.data.price`,
      ""
    )
  );
}

async function getPriceHuobi(token) {
  const id = HuobiSymbols[token.toLowerCase()];
  return safeApiCall("huobi", () =>
    callSignAPICall(
      `https://api.huobi.pro/market/history/trade?symbol=${id}usdt&size=1`,
      `data.data[0].data[0].price`,
      ""
    )
  );
}

async function getPriceByBit(token) {
  const id = ByBitSymbols[token.toLowerCase()];
  return safeApiCall("bybit", () =>
    callSignAPICall(
      `https://api.bybit.com/derivatives/v3/public/tickers?symbol=${id}USDT`,
      `data.result.list[0].prevPrice1h`,
      ""
    )
  );
}

async function getPriceCexIO(token) {
  const id = CexIOSymbols[token.toLowerCase()];
  return safeApiCall("cexio", () =>
    callSignAPICall(
      `https://cex.io/api/last_price/${id}/USD`,
      `data.lprice`,
      ""
    )
  );
}

async function getPriceSwapZone(token) {
  const id = SwapZoneSymbols[token.toLowerCase()];
  return safeApiCall("swapzone", () =>
    callSignAPICall(
      `https://api.swapzone.io/v1/exchange/get-rate?from=${id}&to=usdc&amount=1000`,
      `data.amountTo`,
      "x-api-key"
    )
  );
}

async function getPriceMexc(token) {
  const id = MEXCSymbols[token.toLowerCase()];
  return safeApiCall("mexc", () =>
    callSignAPICall(
      `https://api.mexc.com/api/v3/ticker/price?symbol=${id}USDT`,
      `data.price`,
      ""
    )
  );
}
async function getPriceGateio(token) {
  const id = GateIOSymbols[token.toLowerCase()];
  return safeApiCall("gateio", () =>
    callSignAPICall(
      `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${id}_USDT`,
      `data[0].last`,
      ""
    )
  );
}
async function getPriceOkx(token) {
  const id = OKXSymbols[token.toLowerCase()];
  return safeApiCall("okx", () =>
    callSignAPICall(
      `https://www.okx.com/api/v5/market/ticker?instId=${id}-USDT`,
      `data.data[0].last`,
      ""
    )
  );
}

async function getPricePoloniex(token) {
  const id = PoloniexSymbols[token.toLowerCase()];
  return safeApiCall("poloniex", () =>
    callSignAPICall(
      `https://api.poloniex.com/markets/${id}_USDT/price`,
      `data.price`,
      ""
    )
  );
}

async function getPriceBtse(token) {
  const id = BTSESymbols[token.toLowerCase()];
  return safeApiCall("btse", () =>
    callSignAPICall(
      `https://api.btse.com/spot/api/v3.2/price?symbol=${id}-USD`,
      `data[0].lastPrice`,
      ""
    )
  );
}

async function removeOutliers(prices, timestamps, signatures, urls, threshold) {
  try {
    const median = getMedian(prices);
    const mad = getMAD(prices);

    // Process all arrays in a single loop for better performance
    const result = prices.reduce(
      (acc, price, i) => {
        if (isNaN(Number(price))) return acc;

        const deviation = Math.abs(price - median);
        if (deviation <= threshold * mad) {
          acc.prices.push(price);
          acc.timestamps.push(timestamps[i]);
          acc.signatures.push(signatures[i]);
          acc.urls.push(urls[i]);
        }
        return acc;
      },
      { prices: [], timestamps: [], signatures: [], urls: [] }
    );

    console.log(
      "Data Points Considered:",
      `${result.prices.length}/${prices.length}`
    );

    return [result.prices, result.signatures, result.timestamps, result.urls];
  } catch (error) {
    console.error("Error removing outliers:", error.message || "Unknown error");
    throw error;
  }
}

async function createAssetInfoArray(token) {
  const priceFunctions = [
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
    getPriceCexIO,
    getPriceMexc,
    getPriceOkx,
    getPriceGateio,
    getPricePoloniex,
    getPriceBtse,
  ];

  console.log("Total Data Providers :", priceFunctions.length);

  // Execute all API calls in parallel
  const results = await Promise.all(priceFunctions.map((func) => func(token)));

  // Process results in a single pass
  const validResults = results.reduce(
    (acc, result) => {
      if (result[0] !== "0") {
        acc.prices.push(parseFloat(result[0]));
        acc.timestamps.push(result[1]);
        acc.signatures.push(result[2]);
        acc.urls.push(result[3]);
      }
      return acc;
    },
    { prices: [], timestamps: [], signatures: [], urls: [] }
  );

  // Remove outliers using MAD at 2.5 threshold
  return removeOutliers(
    validResults.prices,
    validResults.timestamps,
    validResults.signatures,
    validResults.urls,
    2.5
  );
}

async function getPriceOf(token) {
  try {
    // Get cleaned data arrays
    const [prices, signatures, timestamps, urls] = await createAssetInfoArray(
      token
    );

    // If no valid datapoints returned, bail early to avoid NaN/BigInt errors
    if (!prices || prices.length === 0) {
      throw new Error("No valid prices returned from providers");
    }

    // Calculate mean price
    const meanPrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const aggregatedAt = Date.now();
    const processedMeanPrice = processFloatString(meanPrice);

    if (processedMeanPrice === "Invalid input") {
      throw new Error("Processed mean price is invalid");
    }

    // Sign the processed mean price
    const signedPrice = testnetSignatureClient.signFields(
      [BigInt(processedMeanPrice)],
      DOOT_CALLER_KEY
    );

    console.log("Mean:", meanPrice, " | Processed Mean:", processedMeanPrice);
    console.log("Signature over processed mean:", signedPrice.signature);

    // Format signature for API compatibility
    const jsonCompatibleSignature = {
      signature: signedPrice.signature,
      publicKey: signedPrice.publicKey,
      data: signedPrice.data[0].toString(),
    };

    // Create final cache object
    const assetCacheObject = {
      price: processedMeanPrice,
      floatingPrice: meanPrice,
      decimals: MULTIPLICATION_FACTOR,
      aggregationTimestamp: aggregatedAt,
      signature: jsonCompatibleSignature,
      prices_returned: prices,
      signatures: signatures,
      timestamps: timestamps,
      urls: urls,
    };

    return [meanPrice, assetCacheObject];
  } catch (error) {
    console.error("Error in getPriceOf:", error.message || "Unknown error");
    throw error;
  }
}

module.exports = getPriceOf;
