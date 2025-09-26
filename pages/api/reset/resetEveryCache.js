const { redis } = require("@/utils/helper/init/InitRedis.js");

const {
  TOKEN_TO_CACHE,
  TOKEN_TO_GRAPH_DATA,
  TOKEN_TO_AGGREGATION_PROOF_CACHE,
  HISTORICAL_CID_CACHE,
  MINA_CID_CACHE,
} = require("@/utils/constants/info.js");

const pinHistoricalObject = require("@/utils/helper/PinHistorical.js");
const pinMinaObject = require("@/utils/helper/PinMinaObject");
const getPriceOf = require("@/utils/helper/GetPriceOf.js");

async function PriceOf(key) {
  return new Promise((resolve) => {
    const results = getPriceOf(key);
    resolve(results);
  });
}

// Step 1: Clear ALL existing cache keys
async function clearAllCaches() {
  console.log("🧹 CLEARING ALL EXISTING CACHE KEYS...");

  const tokenKeys = Object.keys(TOKEN_TO_CACHE);

  // Clear all cache types for all tokens
  for (const tokenKey of tokenKeys) {
    // Clear price cache
    await redis.del(TOKEN_TO_CACHE[tokenKey]);
    console.log(`  ✅ Cleared price cache: ${TOKEN_TO_CACHE[tokenKey]}`);

    // Clear graph cache
    await redis.del(TOKEN_TO_GRAPH_DATA[tokenKey]);
    console.log(`  ✅ Cleared graph cache: ${TOKEN_TO_GRAPH_DATA[tokenKey]}`);

    // Clear aggregation proof cache
    await redis.del(TOKEN_TO_AGGREGATION_PROOF_CACHE[tokenKey]);
    console.log(
      `  ✅ Cleared aggregation cache: ${TOKEN_TO_AGGREGATION_PROOF_CACHE[tokenKey]}`
    );
  }

  // Clear IPFS CID caches
  await redis.del(HISTORICAL_CID_CACHE);
  console.log(`  ✅ Cleared historical CID cache: ${HISTORICAL_CID_CACHE}`);

  await redis.del(MINA_CID_CACHE);
  console.log(`  ✅ Cleared Mina CID cache: ${MINA_CID_CACHE}`);

  console.log("🧹 ALL CACHES CLEARED!\n");
}

// Step 2: Initialize price caches with fresh data
async function initializeTokenCaches(keys) {
  console.log("💰 INITIALIZING PRICE CACHES...");

  for (const key of keys) {
    try {
      console.log(`  📊 Fetching fresh prices for: ${key}`);
      const results = await PriceOf(key);

      // results[1] is the complete assetCacheObject from GetPriceOf
      await redis.set(TOKEN_TO_CACHE[key], results[1]);
      console.log(`  ✅ Initialized price cache: ${TOKEN_TO_CACHE[key]}`);
    } catch (error) {
      console.error(`  ❌ Failed to initialize ${key}:`, error.message);
      // Continue with other tokens even if one fails
    }
  }

  console.log("💰 PRICE CACHES INITIALIZED!\n");
}

// Step 3: Initialize graph caches with empty but valid structure
async function initializeGraphCaches(keys) {
  console.log("📈 INITIALIZING GRAPH CACHES...");

  for (const key of keys) {
    const emptyGraphData = {
      graph_data: [],
      min_price: 0,
      max_price: 0,
      percentage_change: "0",
    };

    await redis.set(TOKEN_TO_GRAPH_DATA[key], emptyGraphData);
    console.log(`  ✅ Initialized graph cache: ${TOKEN_TO_GRAPH_DATA[key]}`);
  }

  console.log("📈 GRAPH CACHES INITIALIZED!\n");
}

// Step 4: Initialize aggregation proof caches with default structure
async function initializeAggregationCaches(keys) {
  console.log("🔐 INITIALIZING AGGREGATION PROOF CACHES...");

  for (const key of keys) {
    const defaultProofStructure = {
      publicInput: [],
      publicOutput: [],
      maxProofsVerified: 0,
      proof: "",
    };

    await redis.set(
      TOKEN_TO_AGGREGATION_PROOF_CACHE[key],
      defaultProofStructure
    );
    console.log(
      `  ✅ Initialized aggregation cache: ${TOKEN_TO_AGGREGATION_PROOF_CACHE[key]}`
    );
  }

  console.log("🔐 AGGREGATION PROOF CACHES INITIALIZED!\n");
}

// Step 5: Initialize IPFS caches with fresh data
async function initializeIPFSCaches(keys) {
  console.log("🌐 INITIALIZING IPFS CACHES...");

  try {
    // Prepare data object for IPFS pinning
    const ipfsDataObject = {};

    for (const key of keys) {
      const cachedData = await redis.get(TOKEN_TO_CACHE[key]);
      if (cachedData) {
        ipfsDataObject[key] = cachedData;
      }
    }

    // Initialize historical IPFS with fresh data
    console.log("  📚 Creating fresh historical IPFS data...");
    const historicalCID = await pinHistoricalObject("NULL", ipfsDataObject);
    await redis.set(HISTORICAL_CID_CACHE, historicalCID);
    console.log(`  ✅ Initialized historical CID: ${historicalCID}`);

    // Initialize Mina IPFS with fresh data
    console.log("  ⛓️  Creating fresh Mina IPFS data...");
    console.log("  🔍 pinMinaObject type:", typeof pinMinaObject);
    console.log("  🔍 ipfsDataObject keys:", Object.keys(ipfsDataObject));
    console.log(
      "  🔍 Sample data:",
      JSON.stringify(ipfsDataObject.mina?.price || "NO MINA DATA")
    );

    const minaResult = await pinMinaObject(ipfsDataObject, "NULL");
    // minaResult returns [ipfsHash, commitment]
    await redis.set(MINA_CID_CACHE, minaResult);
    console.log(
      `  ✅ Initialized Mina CID: ${minaResult[0]}, Commitment: ${minaResult[1]}`
    );
  } catch (error) {
    console.error("  ❌ Failed to initialize IPFS caches:", error.message);
    throw error;
  }

  console.log("🌐 IPFS CACHES INITIALIZED!\n");
}

export default async function handler(req, res) {
  let responseAlreadySent = false;

  try {
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    const keys = Object.keys(TOKEN_TO_CACHE);
    console.log(
      "\n🚀 =============== COMPLETE CACHE RESET & INITIALIZATION =============== 🚀\n"
    );

    // Step 1: Clear all existing caches
    await clearAllCaches();

    // Step 2: Initialize price caches with fresh data
    await initializeTokenCaches(keys);

    // Step 3: Initialize graph caches with empty valid structure
    await initializeGraphCaches(keys);

    // Step 4: Initialize aggregation proof caches
    await initializeAggregationCaches(keys);

    // Step 5: Initialize IPFS caches with fresh pinned data
    await initializeIPFSCaches(keys);

    console.log(
      "🎉 =============== CACHE RESET COMPLETED SUCCESSFULLY! =============== 🎉\n"
    );
    console.log("📋 SUMMARY:");
    console.log(
      `   • Price Caches: ${
        Object.keys(TOKEN_TO_CACHE).length
      } tokens initialized`
    );
    console.log(
      `   • Graph Caches: ${
        Object.keys(TOKEN_TO_GRAPH_DATA).length
      } tokens initialized`
    );
    console.log(
      `   • Aggregation Caches: ${
        Object.keys(TOKEN_TO_AGGREGATION_PROOF_CACHE).length
      } tokens initialized`
    );
    console.log(
      `   • IPFS Caches: 2 CID caches (historical + mina) initialized`
    );
    console.log(
      `   • Total Cache Keys Managed: ${
        Object.keys(TOKEN_TO_CACHE).length * 3 + 2
      }`
    );
    console.log("\n✅ System is ready for normal cron operations!");

    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.status(200).json({
        status: true,
        message: "Complete cache reset and initialization successful!",
        data: {
          tokensInitialized: Object.keys(TOKEN_TO_CACHE).length,
          cacheTypesInitialized: [
            "prices",
            "graphs",
            "aggregation_proofs",
            "ipfs_cids",
          ],
          totalCacheKeys: Object.keys(TOKEN_TO_CACHE).length * 3 + 2,
          readyForCrons: true,
        },
      });
    }
  } catch (error) {
    console.error("❌ CACHE RESET FAILED:", error.message || "Unknown error");
    console.error("Stack trace:", error.stack);

    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.status(500).json({
        status: false,
        message: "Cache reset failed",
        error: error.message || "Internal Server Error",
      });
    }
  }
}
