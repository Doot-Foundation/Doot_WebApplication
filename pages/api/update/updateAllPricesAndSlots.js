const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SIGNED_SLOT,
  ORACLE_PUBLIC_KEY,
  HISTORICAL_CACHE,
  TOKEN_TO_GRAPH_DATA,
} = require("../../../utils/constants/info.js");

const { redis } = require("../../../utils/helper/InitRedis.js");

const getPriceOf = require("../../../utils/helper/GetPriceOf.js");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");
const generateGraphData = require("../../../utils/helper/GenerateGraphData.js");

const axios = require("axios");
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

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

function produceLatestArray(latestObj) {
  const tokenLatestArray = new Array();
  tokenLatestArray.push(latestObj);

  console.log(tokenLatestArray);
  return tokenLatestArray;
}

async function PriceOf(token) {
  return new Promise((resolve) => {
    const results = getPriceOf(token);
    resolve(results);
  });
}

async function startFetchAndUpdates(tokens) {
  const cid = await redis.get(HISTORICAL_CACHE);
  const pinnedData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
  const ipfs = pinnedData.data;

  for (const token of tokens) {
    try {
      console.log("=======================\n", token);
      const results = await PriceOf(token);

      await redis.set(TOKEN_TO_CACHE[token], results[1]);
      await redis.set(TOKEN_TO_SIGNED_SLOT[token], "NULL");

      await appendSignatureToSlot(
        token,
        results[1],
        results[1].signature,
        ORACLE_PUBLIC_KEY
      );

      const immediate = new Array();
      immediate.push(results[1]);
      const subone = immediate[0].prices_returned[0] < 1 ? true : false;

      const historical_latest = produceLatestArray(ipfs.latest.prices[token]);

      const historical_historical = produceHistoricalArray(
        token,
        ipfs.historical
      );

      // (IMMEDIATE, HISTORICAL_LATEST, HISTORICAL_HISTORICAL)
      const graphResult = await generateGraphData(
        subone,
        immediate,
        historical_latest,
        historical_historical
      );

      const graphResultCacheObj = {
        graph_data: graphResult[0],
        min_price: graphResult[1],
        max_price: graphResult[2],
        percentage_change: graphResult[3],
      };

      await redis.set(TOKEN_TO_GRAPH_DATA[token], graphResultCacheObj);
    } catch (err) {
      console.log("Failed For", token);
    }
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const keys = Object.keys(TOKEN_TO_CACHE);
  await startFetchAndUpdates(keys);

  res.status(200).json({
    status: `Updated Prices Successfully!`,
    timestamp: Date.now(),
  });
}
