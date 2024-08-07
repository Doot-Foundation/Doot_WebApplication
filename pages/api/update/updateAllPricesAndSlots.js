const { redis } = require("../../../utils/helper/init/InitRedis.js");

const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SYMBOL,
  TOKEN_TO_SIGNED_SLOT,
  TOKEN_TO_GRAPH_DATA,
  HISTORICAL_CID_CACHE,
} = require("../../../utils/constants/info.js");

const getPriceOf = require("../../../utils/helper/GetPriceOf.js");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot.js");
const generateGraphData = require("../../../utils/helper/GenerateGraphData.js");

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
  const tokenLatestArray = new Array();
  tokenLatestArray.push(latestObj);

  return tokenLatestArray;
}

async function PriceOf(token) {
  return new Promise((resolve) => {
    const results = getPriceOf(token);
    resolve(results);
  });
}

async function startFetchAndUpdates(tokens) {
  const cid = await redis.get(HISTORICAL_CID_CACHE);
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  const pinnedData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
  const ipfs = pinnedData.data;

  const failed = [];

  for (const token of tokens) {
    console.log("\n+++++++++++ STARTING JOB +++++++++++");

    try {
      console.log("++ " + token, "\n");

      const results = await PriceOf(token);

      await redis.set(TOKEN_TO_CACHE[token], results[1]);
      await redis.set(TOKEN_TO_SIGNED_SLOT[token], "NULL");

      const DEPLOYER_PUBLIC_KEY = process.env.NEXT_PUBLIC_DEPLOYER_PUBLIC_KEY;

      await appendSignatureToSlot(
        token,
        results[1],
        results[1].signature,
        DEPLOYER_PUBLIC_KEY
      );

      const latest = new Array();
      latest.push(results[1]);

      // Check if the price is under 1.
      const subone = results[0] < 1 ? true : false;

      const historical_latest = produceHistoricalLatestArray(
        ipfs.latest.prices[token]
      );
      const historical_historical = produceHistoricalArray(
        token,
        ipfs.historical
      );

      // (IMMEDIATE, HISTORICAL_LATEST, HISTORICAL_HISTORICAL)
      // IN THIS CASE, THE MOST FREQUENTLY CHANGED INFO IS THE LATEST - 10 MINUTES.
      // THE HISTORICAL VALUES ARE UPDATED EVERY 30 MINUTES.
      const graphResult = await generateGraphData(
        subone,
        latest,
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
      failed.push(token);
    }
  }
  console.log("+++++++++++ FINISHED JOB +++++++++++\n");
  return failed;
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const tokens = Object.keys(TOKEN_TO_SYMBOL);
  const failed = await startFetchAndUpdates(tokens);

  if (failed.length > 0) {
    res.status(200).json({
      status: true,
      message: `Updated prices partially.`,
      data: {
        failed: failed,
      },
    });
  } else
    res.status(200).json({
      status: true,
      message: `Updated prices successfully.`,
    });
}
