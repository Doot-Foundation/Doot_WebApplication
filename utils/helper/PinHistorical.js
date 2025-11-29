const unpin = require("./Unpin");
const { pinJsonAsTextFile, fetchJsonFromCid } = require("./pinataFileHelpers");
const { uploadWithHashAndCleanup } = require("./supabaseStorage");
const axios = require("axios");

const ONE_YEAR = 60 * 60 * 24 * 365 * 1000; // One year in milliseconds

/**
 * Removes timestamps older than 1 year
 */
function removeOldTimestamps(obj) {
  const currentTime = Date.now();
  Object.keys(obj.historical).forEach((key) => {
    if (currentTime - Number(key) > ONE_YEAR) {
      delete obj.historical[key];
    }
  });
}

function isSupabaseCid(cid) {
  return typeof cid === "string" && cid.startsWith("supabase-");
}

async function fetchHistoricalSource(cid) {
  const bucket =
    process.env.SUPABASE_HISTORICAL_BUCKET ||
    process.env.SUPABASE_PRICE_BUCKET ||
    "";
  const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const prefix = process.env.SUPABASE_HISTORICAL_PREFIX || "historical";
  const pointerPath =
    process.env.SUPABASE_HISTORICAL_OBJECT || `${prefix}_latest.json`;

  // If it's already a Supabase URL, fetch directly
  if (isSupabaseCid(cid)) {
    const url = cid.replace(/^supabase-/, "");
    const res = await axios.get(url, {
      timeout: 20000,
      headers: { Accept: "application/json" },
    });
    return res.data;
  }

  // Try IPFS first
  try {
    return await fetchJsonFromCid(cid);
  } catch (ipfsErr) {
    console.warn(
      `IPFS fetch failed for previous CID ${cid}: ${
        ipfsErr instanceof Error ? ipfsErr.message : String(ipfsErr)
      }; attempting Supabase pointer fallback`
    );

    if (!baseUrl || !bucket) {
      throw ipfsErr;
    }

    // Try pointer to resolve the latest object path
    try {
      const pointerUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${pointerPath}`;
      const pointerRes = await axios.get(pointerUrl, {
        timeout: 20000,
        responseType: "arraybuffer",
        headers: { Accept: "application/json, text/plain" },
      });
      const pointerBuffer = Buffer.from(pointerRes.data);
      const cleanedPointerString = pointerBuffer
        .toString("utf-8")
        .replace(/[\u0000-\u001F]+/g, "");
      let pointerData;
      try {
        pointerData = JSON.parse(cleanedPointerString);
      } catch (err) {
        throw new Error(
          `Failed to parse pointer ${pointerPath}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      const objectPath =
        pointerData?.object_path || `${prefix}_${Date.now()}.json`; // fallback
      const objUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
      const objRes = await axios.get(objUrl, {
        timeout: 20000,
        responseType: "arraybuffer",
        headers: { Accept: "application/json" },
      });
      const buffer = Buffer.from(objRes.data);
      try {
        return JSON.parse(buffer.toString("utf-8"));
      } catch {
        const zlib = require("zlib");
        const str = zlib.gunzipSync(buffer).toString("utf-8");
        return JSON.parse(str);
      }
    } catch (supErr) {
      console.warn(
        `Supabase pointer/object fetch failed while recovering historical data: ${
          supErr instanceof Error ? supErr.message : String(supErr)
        }`
      );
      throw ipfsErr; // surface original IPFS error if Supabase fallback fails
    }
  }
}

/**
 * Pins historical price data to IPFS (with Supabase continuity)
 */
async function pinHistoricalObject(previousCID, latestPrices) {
  try {
    const timestamp = Date.now();
    let toUploadObject;
    let cidForState = null;

    if (previousCID === "NULL") {
      console.log("Fresh Historical: true");
      toUploadObject = {
        latest: {
          timestamp,
          prices: latestPrices,
        },
        historical: {},
      };
    } else {
      const previousObject = await fetchHistoricalSource(previousCID);

      const previousTimestamp = previousObject.latest.timestamp;

      toUploadObject = {
        latest: {
          timestamp,
          prices: latestPrices,
        },
        historical: {
          ...previousObject.historical,
          [previousTimestamp]: previousObject.latest.prices,
        },
      };
      console.log("Fresh Historical: false");
    }

    removeOldTimestamps(toUploadObject);
    console.log("Removed Historical Data > 1Y(if any).");

    const serializedPayload = JSON.stringify(toUploadObject);

    // Attempt Pinata; if it fails, fall back to Supabase-only identifier
    let uploadResponse;
    try {
      uploadResponse = await pinJsonAsTextFile(
        serializedPayload,
        `historical_${timestamp}`
      );

      if (!uploadResponse || !uploadResponse.IpfsHash) {
        throw new Error("No IpfsHash returned from Pinata");
      }

      // Verify via IPFS
      const verificationData = await fetchJsonFromCid(uploadResponse.IpfsHash);
      if (!verificationData || !verificationData.latest || !verificationData.historical) {
        throw new Error(
          "Invalid data structure: missing 'latest' or 'historical' properties"
        );
      }

      cidForState = uploadResponse.IpfsHash;
    } catch (verifyError) {
      console.warn(
        `Pinata upload/verification failed, using Supabase-only CID: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`
      );
      const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
      const bucket =
        process.env.SUPABASE_HISTORICAL_BUCKET ||
        process.env.SUPABASE_PRICE_BUCKET ||
        "";
      const objectName = `historical_${timestamp}.json`;
      cidForState = `supabase-${baseUrl}/storage/v1/object/public/${bucket}/${objectName}`;
    }

    // Mirror to Supabase and clean up older historical objects
    await uploadWithHashAndCleanup({
      objectPath: `historical_${timestamp}.json`,
      pointerPath: `historical_latest.json`,
      serializedPayload,
      updatedAt: timestamp,
      cleanupPrefix: "historical_",
      cid: cidForState,
    });

    // Only NOW it's safe to unpin the old CID (skip Supabase-only CIDs)
    if (previousCID !== "NULL" && !isSupabaseCid(previousCID)) {
      try {
        await unpin(previousCID, "Historical");
      } catch (unpinError) {
        // Don't fail the entire operation if unpinning fails
        console.warn(
          `Failed to unpin old CID ${previousCID}: ${unpinError.message}`
        );
      }
    }

    console.log("Pinned Historical Data:", uploadResponse);
    return cidForState;
  } catch (error) {
    console.error(
      "Error pinning historical object:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = pinHistoricalObject;
