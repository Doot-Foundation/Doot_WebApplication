const axios = require("axios");

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
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

async function fetchIPFSWithRetry(url, maxRetries = 3, timeout = 10000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout,
        headers: {
          Accept: "application/json",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        decompress: true,
        validateStatus: (status) => status === 200,
      });
      validateHistoricalPayload(res.data, "IPFS data");
      return res.data;
    } catch (error) {
      lastError = error;
      const reason = error?.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;
      console.warn(`IPFS fetch attempt ${attempt} failed: ${reason}`);

      if (attempt < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new Error(
    `IPFS fetch failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Fetches historical data with IPFS first and Supabase fallback.
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<Object>} Historical data
 */
async function getHistoricalInfo(cid) {
  if (!cid) {
    throw new Error("CID is required to fetch historical info");
  }
  if (!GATEWAY) {
    throw new Error("NEXT_PUBLIC_PINATA_GATEWAY is not configured");
  }

  const ipfsUrl = `https://${GATEWAY}/ipfs/${cid}`;

  try {
    return await fetchIPFSWithRetry(ipfsUrl, 3, 120000);
  } catch (ipfsError) {
    console.error(
      `IPFS fetch failed (${ipfsError.message}). Attempting Supabase fallback...`
    );

    if (!isSupabaseConfigured()) {
      throw new Error(
        `IPFS fetch failed (${ipfsError.message}) and Supabase fallback is not configured`
      );
    }

    return await fetchSupabaseHistoricalData(cid, 120000);
  }
}

module.exports = getHistoricalInfo;
