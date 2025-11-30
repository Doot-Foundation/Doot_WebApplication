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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_HISTORICAL_BUCKET =
  process.env.SUPABASE_HISTORICAL_BUCKET || process.env.SUPABASE_PRICE_BUCKET;
const SUPABASE_HISTORICAL_PREFIX = (
  process.env.SUPABASE_HISTORICAL_PREFIX || "historical"
).replace(/^\/+|\/+$/g, "");
const SUPABASE_HISTORICAL_OBJECT = process.env.SUPABASE_HISTORICAL_OBJECT
  ? process.env.SUPABASE_HISTORICAL_OBJECT.replace(/^\/+/, "")
  : null;

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

function validateHistoricalPayload(payload, sourceLabel = "Historical data") {
  if (!payload) {
    throw new Error(`${sourceLabel} is empty`);
  }

  if (!payload.latest || !payload.latest.prices) {
    throw new Error(`${sourceLabel} missing "latest.prices" structure`);
  }

  if (!payload.historical || typeof payload.historical !== "object") {
    throw new Error(`${sourceLabel} missing "historical" structure`);
  }
}

function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_HISTORICAL_BUCKET)
  );
}

function buildSupabaseObjectCandidates(cid, pointerData) {
  const candidates = [];

  if (pointerData?.object_path) {
    candidates.push(pointerData.object_path);
  }

  const prefix = SUPABASE_HISTORICAL_PREFIX || "historical";
  candidates.push(`${prefix}_latest.json`);
  if (cid) {
    candidates.push(`${prefix}_${cid}.json`);
    candidates.push(`${prefix}_${cid}.txt`);
  }

  return [...new Set(candidates)];
}

async function fetchSupabasePointer(timeout = 10000) {
  const pointerPath =
    SUPABASE_HISTORICAL_OBJECT ||
    `${SUPABASE_HISTORICAL_PREFIX || "historical"}_latest.json`;

  const baseStorageUrl = `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object`;
  const url = `${baseStorageUrl}/${SUPABASE_HISTORICAL_BUCKET}/${pointerPath.replace(
    /^\/+/,
    ""
  )}`;

  try {
    const response = await axios.get(url, {
      timeout,
      responseType: "text",
      headers: {
        ...(SUPABASE_SERVICE_KEY
          ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
          : {}),
        Accept: "application/json, text/plain",
      },
      validateStatus: (status) => status === 200,
    });
    const payload =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
    if (payload && typeof payload === "object") {
      return { pointerPath, pointerPayload: payload };
    }
  } catch (err) {
    console.warn(
      `Supabase pointer fetch failed for ${pointerPath}: ${
        err?.message || "unknown error"
      }`
    );
  }
  return undefined;
}

async function fetchSupabaseHistoricalData(cid, timeout = 60000) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase storage not configured: missing SUPABASE_URL or SUPABASE_HISTORICAL_BUCKET"
    );
  }

  const baseStorageUrl = `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object`;
  const pointerInfo = await fetchSupabasePointer().catch(() => undefined);
  const candidates = buildSupabaseObjectCandidates(cid, pointerInfo?.pointerPayload);

  if (candidates.length === 0) {
    throw new Error("No Supabase object paths to try for historical data");
  }

  let lastError;

  for (const objectPath of candidates) {
    const fullPath = objectPath.replace(/^\/+/, "");
    const url = `${baseStorageUrl}/${SUPABASE_HISTORICAL_BUCKET}/${fullPath}`;

    try {
      console.log(`Fetching historical backup from Supabase object: ${fullPath}`);
      const response = await axios.get(url, {
        timeout,
        responseType: "text",
        headers: {
          ...(SUPABASE_SERVICE_KEY
            ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
            : {}),
          Accept: "application/json, text/plain",
        },
        validateStatus: (status) => status === 200,
      });

      const payload =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      validateHistoricalPayload(payload, `Supabase object ${fullPath}`);
      console.log("Supabase backup fetch succeeded");
      return payload;
    } catch (error) {
      lastError = error;
      const reason = error?.response
        ? `HTTP ${error.response.status}`
        : error.message;
      console.warn(
        `Supabase fetch failed for ${objectPath}: ${reason}. Trying next fallback (if any).`
      );
    }
  }

  throw new Error(
    `All Supabase fallback attempts failed${lastError ? `: ${lastError.message}` : ""}`
  );
}

async function fetchIPFSWithRetry(url, maxRetries = 3, timeout = 60000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching IPFS data (attempt ${attempt}/${maxRetries})...`);

      const response = await axios.get(url, {
        timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        decompress: true,
        validateStatus: (status) => status === 200,
      });

      validateHistoricalPayload(response.data, "IPFS data");
      console.log("Successfully fetched and validated IPFS data");
      return response.data;
    } catch (error) {
      lastError = error;
      let errorMsg = error.message;
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMsg = "Request timeout";
      } else if (error.code === "ERR_BAD_RESPONSE") {
        errorMsg = "Bad response from gateway";
      } else if (error.code === "ERR_NETWORK" || error.code === "ECONNRESET") {
        errorMsg = "Network connection error";
      } else if (axios.isAxiosError(error) && error.response) {
        errorMsg = `HTTP ${error.response.status}: ${error.response.statusText}`;
      }

      console.error(`IPFS fetch attempt ${attempt} failed: ${errorMsg}`);

      if (attempt < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new Error(
    `Failed to fetch IPFS data after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

async function fetchHistoricalData(cid, gateway) {
  const ipfsUrl = `https://${gateway}/ipfs/${cid}`;

  try {
    const data = await fetchIPFSWithRetry(ipfsUrl, 3, 120000);
    return { data, source: "ipfs" };
  } catch (ipfsError) {
    console.error(
      `IPFS fetch failed (${ipfsError.message}). Attempting Supabase fallback...`
    );

    if (!isSupabaseConfigured()) {
      throw new Error(
        `IPFS fetch failed (${ipfsError.message}) and Supabase fallback is not configured`
      );
    }

    try {
      const supabaseData = await fetchSupabaseHistoricalData(cid, 120000);
      return { data: supabaseData, source: "supabase" };
    } catch (supabaseError) {
      throw new Error(
        `IPFS fetch failed (${ipfsError.message}); Supabase fallback also failed: ${supabaseError.message}`
      );
    }
  }
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
  const historical = await fetchHistoricalData(cid, gateway);
  console.log(`Historical dataset source: ${historical.source}`);

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
        historical.data.latest.prices[token]
      );
      const historicalHistorical = produceHistoricalArray(
        token,
        historical.data.historical
      );

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
