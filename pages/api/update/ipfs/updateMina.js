const { redis } = require("@/utils/helper/init/InitRedis.js");

const { MINA_CID_CACHE } = require("@/utils/constants/info.js");
const pinMinaObject = require("@/utils/helper/PinMinaObject.ts");

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    const obj = {};

    // Get all token cache keys and fetch their data (same fix as updateHistorical.js)
    const { TOKEN_TO_CACHE } = require("@/utils/constants/info.js");
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);

    // Fix Redis pipeline issue by validating cache keys and handling them properly
    const validCacheKeys = [];
    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey];
      if (cacheKey && typeof cacheKey === 'string' && cacheKey.trim() !== '') {
        validCacheKeys.push({ tokenKey, cacheKey });
      } else {
        console.warn(`Invalid cache key for token ${tokenKey}:`, cacheKey);
      }
    }

    // Process cache keys sequentially to avoid pipeline issues
    for (const { tokenKey, cacheKey } of validCacheKeys) {
      try {
        const data = await redis.get(cacheKey);
        if (data) {
          obj[tokenKey] = data;
        }
      } catch (error) {
        console.error(`Failed to get cache for ${tokenKey} (${cacheKey}):`, error.message);
        // Continue with other tokens instead of failing completely
      }
    }

    console.log(`Collected data for ${Object.keys(obj).length} tokens:`, Object.keys(obj));

    // Validate MINA_CID_CACHE key before using it
    if (!MINA_CID_CACHE || typeof MINA_CID_CACHE !== 'string') {
      throw new Error("Invalid MINA_CID_CACHE key");
    }

    // Get existing Mina CID cache data
    const minaCacheData = await redis.get(MINA_CID_CACHE);

    if (!minaCacheData) {
      throw new Error("No Mina CID found in cache");
    }

    const [cid, commitment] = minaCacheData;

    if (!cid) {
      throw new Error("Invalid Mina cache data structure");
    }

    console.log(`Updating Mina IPFS with previous CID: ${cid}`);
    const results = await pinMinaObject(obj, cid);

    if (!results || !Array.isArray(results) || results.length < 2) {
      throw new Error("Invalid result from pinMinaObject");
    }

    // IPFS PIN UPDATED.
    await redis.set(MINA_CID_CACHE, results);

    console.log(`Mina IPFS updated successfully. New CID: ${results[0]}, Commitment: ${results[1]}`);

    return res.status(200).json({
      status: true,
      message: "Updated Mina L1 IPFS data successfully.",
      data: {
        cid: results[0],
        merkle_map_commitment: results[1],
      },
    });
  } catch (error) {
    console.error("Error in updateMina handler:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to update Mina IPFS data",
      error: error.message
    });
  }
}
