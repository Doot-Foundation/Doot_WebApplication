const { redis } = require("./utils/helper/init/InitRedis");
const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SYMBOL,
  TOKEN_TO_GRAPH_DATA,
  HISTORICAL_CID_CACHE,
} = require("./utils/constants/info");
const getPriceOf = require("./utils/helper/GetPriceOf");
const generateGraphData = require("./utils/helper/GenerateGraphData");
const axios = require("axios");

function produceHistoricalArray(token, historicalObj) {
  const tokenHistoricalArray = [];
  const timestamps = Object.keys(historicalObj);

  for (const timestamp of timestamps) {
    const data = historicalObj[timestamp][token];
    if (data) {
      data.timestamp = timestamp;
      tokenHistoricalArray.push(data);
    }
  }

  return tokenHistoricalArray;
}

function produceHistoricalLatestArray(latestObj) {
  const tokenLatestArray = [];
  tokenLatestArray.push(latestObj);

  return tokenLatestArray;
}

async function priceOf(token) {
  return await getPriceOf(token);
}

async function fetchIPFSWithRetry(url, maxRetries = 3, timeout = 60000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching IPFS data (attempt ${attempt}/${maxRetries})...`);

      const response = await axios.get(url, {
        timeout: timeout,
        maxContentLength: 100 * 1024 * 1024, // 100MB
        maxBodyLength: 100 * 1024 * 1024,
        decompress: true,
        validateStatus: (status) => status === 200,
      });

      console.log(`Successfully fetched IPFS data (${response.data ? 'valid' : 'empty'} response)`);
      return response.data;

    } catch (error) {
      lastError = error;
      const errorMsg = error.code === 'ECONNABORTED'
        ? 'Request timeout'
        : error.code === 'ERR_BAD_RESPONSE'
        ? 'Bad response from gateway'
        : error.message;

      console.error(`IPFS fetch attempt ${attempt} failed: ${errorMsg}`);

      if (attempt < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new Error(`Failed to fetch IPFS data after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

async function startFetchAndUpdates(tokens) {
  const cid = await redis.get(HISTORICAL_CID_CACHE);

  if (!cid) {
    throw new Error("Historical CID not found in cache");
  }

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  if (!gateway) {
    throw new Error("PINATA_GATEWAY environment variable not set");
  }

  console.log("Last known historical CID :", cid);

  const ipfs = await fetchIPFSWithRetry(`https://${gateway}/ipfs/${cid}`, 3, 60000);
  const failed = [];

  for (const token of tokens) {
    console.log("\n+++++++++++ STARTING JOB +++++++++++");

    try {
      console.log("++ " + token, "\n");

      const results = await priceOf(token);

      await redis.set(TOKEN_TO_CACHE[token], results[1]);

      const latest = [];
      latest.push(results[1]);

      const subone = results[0] < 1;

      const historicalLatest = produceHistoricalLatestArray(
        ipfs.latest.prices[token]
      );
      const historicalHistorical = produceHistoricalArray(token, ipfs.historical);

      const graphResult = await generateGraphData(
        subone,
        latest,
        historicalLatest,
        historicalHistorical
      );

      const graphResultCacheObj = {
        graph_data: graphResult[0],
        min_price: graphResult[1],
        max_price: graphResult[2],
        percentage_change: graphResult[3],
      };

      await redis.set(TOKEN_TO_GRAPH_DATA[token], graphResultCacheObj);
    } catch (err) {
      console.error(`Failed to update token ${token}:`, err.message);
      failed.push(token);
    }
  }
  console.log("+++++++++++ FINISHED JOB +++++++++++\n");
  return failed;
}

async function updateAllPrices() {
  const tokens = Object.keys(TOKEN_TO_SYMBOL);
  const failed = await startFetchAndUpdates(tokens);
  return { failed };
}

module.exports = { updateAllPrices };
