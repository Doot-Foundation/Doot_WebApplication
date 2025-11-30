const axios = require("axios");
const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DEFAULT_BUCKET =
  process.env.SUPABASE_HISTORICAL_BUCKET || process.env.SUPABASE_PRICE_BUCKET;

function ensureBucket(bucket) {
  const resolved = bucket || DEFAULT_BUCKET;
  if (!resolved) {
    throw new Error(
      "Supabase bucket not configured (SUPABASE_HISTORICAL_BUCKET or SUPABASE_PRICE_BUCKET)"
    );
  }
  return resolved;
}

function ensureConfig(bucket) {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured");
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_KEY is not configured for uploads");
  }
  return ensureBucket(bucket);
}

function baseStorageUrl() {
  return `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object`;
}

function sha256String(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function uploadObject({
  bucket,
  objectPath,
  body,
  contentType = "application/json",
}) {
  const resolvedBucket = ensureConfig(bucket);
  const url = `${baseStorageUrl()}/${resolvedBucket}/${objectPath.replace(
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
    timeout: 20 * 60 * 1000, // 20 minutes for large payloads
    validateStatus: (status) => status === 200,
  });
}

async function downloadObject({ bucket, objectPath }) {
  const resolvedBucket = ensureBucket(bucket);
  const url = `${baseStorageUrl()}/${resolvedBucket}/${objectPath.replace(
    /^\/+/,
    ""
  )}`;

  const response = await axios.get(url, {
    responseType: "text",
    timeout: 30000,
    headers: {
      ...(SUPABASE_SERVICE_KEY
        ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
        : {}),
      Accept: "application/json, text/plain",
    },
    validateStatus: (status) => status === 200,
  });

  return response.data;
}

async function listObjects({ bucket, prefix }) {
  const resolvedBucket = ensureConfig(bucket);
  const url = `${SUPABASE_URL.replace(
    /\/+$/,
    ""
  )}/storage/v1/object/list/${resolvedBucket}`;

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

  return Array.isArray(response.data) ? response.data : [];
}

async function deleteObject({ bucket, objectPath }) {
  const resolvedBucket = ensureConfig(bucket);
  const url = `${baseStorageUrl()}/${resolvedBucket}/${objectPath.replace(
    /^\/+/,
    ""
  )}`;

  await axios.delete(url, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    timeout: 20000,
    validateStatus: (status) => status === 200 || status === 204,
  });
}

async function cleanupPrefixExcept({ bucket, prefix, keep }) {
  const keepSet = new Set(
    (keep || []).map((p) => p.replace(/^\/+/, "").trim())
  );
  const list = await listObjects({ bucket, prefix });

  const deletions = [];
  for (const entry of list) {
    const name = entry.name;
    const path = name;
    if (!keepSet.has(path)) {
      deletions.push(deleteObject({ bucket, objectPath: path }).catch((err) => {
        console.warn(`Failed to delete Supabase object ${path}: ${err.message}`);
      }));
    }
  }

  await Promise.all(deletions);
}

async function uploadWithHashAndCleanup({
  bucket,
  objectPath,
  pointerPath,
  serializedPayload,
  updatedAt,
  cleanupPrefix,
  cid,
}) {
  const payloadString =
    typeof serializedPayload === "string"
      ? serializedPayload
      : serializedPayload.toString("utf-8");
  const hash = sha256String(payloadString);

  await uploadObject({
    bucket,
    objectPath,
    body: serializedPayload,
    contentType: "application/json",
  });

  const downloaded = await downloadObject({
    bucket,
    objectPath,
  });

  const downloadedString =
    typeof downloaded === "string"
      ? downloaded
      : Buffer.from(downloaded).toString("utf-8");

  const downloadedHash = sha256String(downloadedString);
  if (downloadedHash !== hash) {
    throw new Error(
      `Supabase round-trip hash mismatch for ${objectPath}: expected ${hash}, got ${downloadedHash}`
    );
  }

  if (pointerPath) {
    const pointerPayload = JSON.stringify({
      cid: cid || objectPath.split("/").pop(),
      object_path: objectPath,
      sha256: hash,
      updated_at: updatedAt,
    });
    await uploadObject({
      bucket,
      objectPath: pointerPath,
      body: pointerPayload,
      contentType: "application/json",
    });
  }

  if (cleanupPrefix) {
    const keep = [objectPath];
    if (pointerPath) keep.push(pointerPath);
    await cleanupPrefixExcept({
      bucket,
      prefix: cleanupPrefix,
      keep,
    });
  }

  return { hash };
}

module.exports = {
  sha256String,
  uploadObject,
  downloadObject,
  cleanupPrefixExcept,
  uploadWithHashAndCleanup,
};
