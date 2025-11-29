const axios = require("axios");
const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_HISTORICAL_BUCKET =
  process.env.SUPABASE_HISTORICAL_BUCKET || process.env.SUPABASE_PRICE_BUCKET;
const SUPABASE_HISTORICAL_PREFIX =
  process.env.SUPABASE_HISTORICAL_PREFIX || "historical";
const SUPABASE_HISTORICAL_OBJECT = process.env.SUPABASE_HISTORICAL_OBJECT
  ? process.env.SUPABASE_HISTORICAL_OBJECT.replace(/^\/+/, "")
  : null;

function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_SERVICE_KEY) &&
    Boolean(SUPABASE_HISTORICAL_BUCKET)
  );
}

function baseStorageUrl() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase storage is not configured (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_HISTORICAL_BUCKET)"
    );
  }
  return `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object`;
}

function buildHistoricalObjectPath(timestamp) {
  const prefix = SUPABASE_HISTORICAL_PREFIX || "historical";
  return `${prefix}_${timestamp}.json`;
}

function buildPointerObjectPath() {
  if (SUPABASE_HISTORICAL_OBJECT) {
    return SUPABASE_HISTORICAL_OBJECT;
  }

  const prefix = SUPABASE_HISTORICAL_PREFIX || "historical";
  return `${prefix}_latest.json`;
}

async function uploadObject(objectPath, body, contentType = "application/json") {
  const url = `${baseStorageUrl()}/${SUPABASE_HISTORICAL_BUCKET}/${objectPath.replace(
    /^\/+/,
    ""
  )}`;

  await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 20 * 60 * 1000, // 20 minutes for large historical uploads
    validateStatus: (status) => status === 200,
  });
}

async function downloadObject(objectPath) {
  const url = `${baseStorageUrl()}/${SUPABASE_HISTORICAL_BUCKET}/${objectPath.replace(
    /^\/+/,
    ""
  )}`;

  const response = await axios.get(url, {
    responseType: "text",
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Accept: "application/json, text/plain",
    },
    validateStatus: (status) => status === 200,
  });

  return response.data;
}

function sha256String(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Uploads the historical payload and pointer to Supabase storage and verifies round-trip integrity.
 */
async function uploadHistoricalBackup({
  cid,
  serializedPayload,
  sha256,
  updatedAt,
}) {
  if (!cid || typeof cid !== "string") {
    throw new Error("uploadHistoricalBackup requires a CID string");
  }
  if (!serializedPayload || typeof serializedPayload !== "string") {
    throw new Error("uploadHistoricalBackup requires a serialized payload string");
  }

  const objectPath = buildHistoricalObjectPath(updatedAt);
  const pointerPath = buildPointerObjectPath();

  // Upload main historical object
  await uploadObject(objectPath, serializedPayload, "application/json");

  // Verify round-trip integrity against the same serialized content
  const downloaded = await downloadObject(objectPath);
  const downloadedHash = sha256String(downloaded);
  if (downloadedHash !== sha256) {
    throw new Error(
      `Supabase round-trip hash mismatch for ${objectPath}: expected ${sha256}, got ${downloadedHash}`
    );
  }

  // Upload a small pointer/metadata object to make freshness checks easy
  const pointerPayload = JSON.stringify({
    cid,
    object_path: objectPath,
    sha256,
    updated_at: updatedAt,
  });
  await uploadObject(pointerPath, pointerPayload, "application/json");

  // Pointer verification (lightweight: ensure it parses and has cid)
  const pointerDownloaded = await downloadObject(pointerPath);
  try {
    const parsed = JSON.parse(pointerDownloaded);
    if (!parsed || parsed.cid !== cid) {
      throw new Error("Pointer JSON missing expected cid");
    }
  } catch (err) {
    throw new Error(`Supabase pointer verification failed for ${pointerPath}: ${err.message}`);
  }

  return { objectPath, pointerPath };
}

async function cleanupPrefixExcept(prefix, keepPaths) {
  const url = `${SUPABASE_URL.replace(
    /\/+$/,
    ""
  )}/storage/v1/object/list/${SUPABASE_HISTORICAL_BUCKET}`;

  const response = await axios.post(
    url,
    {
      prefix: prefix || "",
      limit: 1000,
      sortBy: { column: "name", order: "desc" },
    },
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
      validateStatus: (status) => status === 200,
    }
  );

  const keepSet = new Set(keepPaths.map((p) => p.replace(/^\/+/, "")));
  const entries = Array.isArray(response.data) ? response.data : [];
  const deletions = [];

  for (const entry of entries) {
    const name = entry.name;
    const fullPath = name;
    if (!keepSet.has(fullPath)) {
      const delUrl = `${SUPABASE_URL.replace(
        /\/+$/,
        ""
      )}/storage/v1/object/${SUPABASE_HISTORICAL_BUCKET}/${fullPath}`;
      deletions.push(
        axios
          .delete(delUrl, {
            headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
            timeout: 20000,
            validateStatus: (status) => status === 200 || status === 204,
          })
          .catch((err) =>
            console.warn(
              `Failed to delete Supabase object ${fullPath}: ${err.message}`
            )
          )
      );
    }
  }

  await Promise.all(deletions);
}

module.exports = {
  isSupabaseConfigured,
  uploadHistoricalBackup,
  sha256String,
  cleanupPrefixExcept,
};
