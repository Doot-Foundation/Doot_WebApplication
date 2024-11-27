const { redis } = require("@/utils/helper/init/InitRedis.js");

const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SYMBOL,
  TOKEN_TO_GRAPH_DATA,
  HISTORICAL_CID_CACHE,
} = require("@/utils/constants/info.js");

const getPriceOf = require("@/utils/helper/GetPriceOf.js");
const generateGraphData = require("@/utils/helper/GenerateGraphData.js");

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

async function startFetchAndUpdates() {
  const cid = await redis.get(HISTORICAL_CID_CACHE);
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  const pinnedData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
  const ipfs = pinnedData.data;

  //   const failed = [];

  const token = "mina";
  console.log("\n+++++++++++ STARTING JOB +++++++++++");

  try {
    console.log("++ " + token, "\n");

    const results = await PriceOf(token);

    await redis.set(TOKEN_TO_CACHE[token], results[1]);

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
    return false;
  }
  console.log("+++++++++++ FINISHED JOB +++++++++++\n");
  return true;
}

export default async function handler(req, res) {
  let responseAlreadySent = false;
  try {
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    const tokens = Object.keys(TOKEN_TO_SYMBOL);
    const success = await startFetchAndUpdates(tokens);
    if (!responseAlreadySent) {
      responseAlreadySent = true;
      if (!success) {
        return res.status(200).json({
          status: false,
          message: `Not updated mina price.`,
        });
      } else {
        responseAlreadySent = true;
        return res.status(200).json({
          status: true,
          message: `Updated mina price.`,
        });
      }
    }
  } catch (err) {
    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res
        .status(500)
        .json({ status: false, message: "Internal Server Error" });
    }
  }
}
