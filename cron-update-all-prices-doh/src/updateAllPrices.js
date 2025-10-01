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
  const pinnedData = await axios.get(`https://${gateway}/ipfs/${cid}`, {
    timeout: 30000,
  });

  const ipfs = pinnedData.data;
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
