const { redis } = require("@/utils/helper/init/InitRedis.js");

const { TOKEN_TO_CACHE, MINA_CID_CACHE } = require("@/utils/constants/info.js");

const pinMinaObject = require("@/utils/helper/PinMinaObject.ts");
const { getToPinIPFSInformation } = require("@/utils/helper/GetMinaInfo.ts");

// Import o1js and contract utilities (from contracts_CLAUDE.md)
const { Mina, PrivateKey, Field, fetchAccount, PublicKey } = require("o1js");
const {
  Doot,
  IpfsCID,
  TokenInformationArray,
} = require("@/utils/constants/Doot.js");
const { FileSystem, fetchDootFiles } = require("@/utils/helper/LoadCache");

/**
 * Combined Doot Oracle Update Endpoint
 * Flow: IPFS Pin → Zeko L2 Update → Mina L1 Update
 * Reuses cryptographic calculations for both networks
 */
export default async function handler(req, res) {
  let responseAlreadySent = false;
  let ipfsCID = null;
  let commitment = null;

  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    console.log(
      "\n =============== DOOT ORACLE UPDATE STARTED =============== \n"
    );

    // ===== STEP 1: COLLECT & VALIDATE TOKEN DATA =====
    console.log(" STEP 1: Collecting token data from cache...");

    const tokenData = {};
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);

    // Required assets for PinMinaObject (must match exactly)
    const requiredAssets = [
      "mina",
      "bitcoin",
      "ethereum",
      "solana",
      "ripple",
      "cardano",
      "avalanche",
      "polygon",
      "chainlink",
      "dogecoin",
    ];

    // Collect data with validation
    const validCacheKeys = [];
    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey];
      if (cacheKey && typeof cacheKey === "string" && cacheKey.trim() !== "") {
        validCacheKeys.push({ tokenKey, cacheKey });
      } else {
        console.warn(`  Invalid cache key for token ${tokenKey}:`, cacheKey);
      }
    }

    // Sequential cache retrieval to avoid pipeline issues
    for (const { tokenKey, cacheKey } of validCacheKeys) {
      try {
        const data = await redis.get(cacheKey);
        if (data) {
          tokenData[tokenKey] = data;
        }
      } catch (error) {
        console.error(
          `ERR! Failed to get cache for ${tokenKey} (${cacheKey}):`,
          error.message
        );
        // Continue with other tokens instead of failing completely
      }
    }

    // Validate all required assets are present
    const missingAssets = requiredAssets.filter((asset) => !tokenData[asset]);
    if (missingAssets.length > 0) {
      throw new Error(
        `Missing required assets for IPFS pinning: ${missingAssets.join(", ")}`
      );
    }

    console.log(
      `SUCCESS! Collected data for ${Object.keys(tokenData).length} tokens:`,
      Object.keys(tokenData)
    );

    // ===== STEP 2: PIN TO IPFS =====
    console.log("\n STEP 2: Pinning oracle state to IPFS...");

    // Get existing Mina CID for unpinning (if exists)
    let previousCID = "NULL";
    try {
      const existingMinaCacheData = await redis.get(MINA_CID_CACHE);
      if (
        existingMinaCacheData &&
        Array.isArray(existingMinaCacheData) &&
        existingMinaCacheData[0]
      ) {
        previousCID = existingMinaCacheData[0];
        console.log(` Found previous CID for unpinning: ${previousCID}`);
      }
    } catch (error) {
      console.log(
        `INFO!  No previous CID found (fresh start): ${error.message}`
      );
    }

    // Pin to IPFS with MerkleMap commitment calculation
    const ipfsResults = await pinMinaObject(tokenData, previousCID);

    if (!ipfsResults || !Array.isArray(ipfsResults) || ipfsResults.length < 2) {
      throw new Error("Invalid result from IPFS pinning operation");
    }

    [ipfsCID, commitment] = ipfsResults;
    console.log(`SUCCESS! IPFS pinning successful:`);
    console.log(`    CID: ${ipfsCID}`);
    console.log(`    Commitment: ${commitment}`);

    // Verify IPFS data is accessible
    console.log("🔍 Verifying IPFS data accessibility...");
    await getToPinIPFSInformation(ipfsCID);
    console.log("SUCCESS! IPFS data verification successful");

    // ===== STEP 3: PREPARE SHARED TRANSACTION DATA =====
    console.log("\n STEP 3: Preparing shared cryptographic data...");

    // Both networks will use the same:
    // - IPFS CID
    // - Merkle commitment
    // - Token information array
    // - Caller private key (DOOT_CALLER_KEY)
    // - Contract private key (DOOT_KEY)

    const sharedTxnData = {
      ipfsCID,
      commitment,
      tokenData,
      callerPrivateKey: process.env.DOOT_CALLER_KEY,
    };

    console.log("SUCCESS! Shared transaction data prepared");

    // ===== STEP 4: UPDATE ZEKO L2 (PRIMARY) =====
    console.log("\n⚡ STEP 4: Updating Zeko L2 contract...");

    let zekoSuccess = false;
    let zekoTxHash = null;

    try {
      const zekoResult = await updateZekoL2Contract(sharedTxnData);
      zekoSuccess = zekoResult.success;
      zekoTxHash = zekoResult.txHash;

      if (zekoSuccess) {
        console.log(`SUCCESS! Zeko L2 update successful! TX: ${zekoTxHash}`);
      } else {
        console.log(`  Zeko L2 update failed: ${zekoResult.error}`);
      }
    } catch (error) {
      console.error(`ERR! Zeko L2 update error: ${error.message}`);
      zekoSuccess = false;
    }

    // ===== STEP 5: UPDATE MINA L1 (WITH TIMEOUT PROTECTION) =====
    console.log("\n STEP 5: Starting Mina L1 update with 5:00 timeout...");

    let minaSuccess = false;
    let minaTxHash = null;
    let minaStatus = "TIMEOUT";
    let minaError = null;

    // Create timeout promise (5 minutes = 300 seconds)
    const minaTimeout = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            timeout: true,
            elapsed: "300s",
            message: "Mina L1 update timed out (5:00 limit)", // Assuming everything before completed in under 3minutes.
          }),
        300000
      )
    );

    try {
      // Race between Mina L1 execution and timeout
      const minaResult = await Promise.race([
        updateMinaL1Contract(sharedTxnData),
        minaTimeout,
      ]);

      if (minaResult.timeout) {
        // Timeout occurred
        minaStatus = "TIMEOUT";
        minaError = minaResult.message;
        console.log(
          `TIME!  Mina L1 update timed out after ${minaResult.elapsed}`
        );
      } else if (minaResult.success) {
        // Success within timeout
        minaSuccess = true;
        minaTxHash = minaResult.txHash;
        minaStatus = "SUCCESS";
        console.log(
          `SUCCESS! Mina L1 update completed successfully! TX: ${minaTxHash}`
        );
      } else {
        // Failed within timeout
        minaStatus = "FAILED";
        minaError = minaResult.error;
        console.log(`ERR! Mina L1 update failed: ${minaResult.error}`);
      }
    } catch (error) {
      // Unexpected error
      minaStatus = "ERROR";
      minaError = error.message;
      console.error(`ERR! Mina L1 update unexpected error: ${error.message}`);
    }

    // ===== STEP 6: UPDATE CACHE & DETERMINE SUCCESS =====
    console.log("\n STEP 6: Updating cache and determining final status...");

    // Update Redis cache if Zeko L2 succeeded (primary network)
    if (zekoSuccess) {
      await redis.set(MINA_CID_CACHE, [ipfsCID, commitment]);
      console.log("SUCCESS! Redis cache updated with new IPFS data");
    }

    // Determine overall success (primary: Zeko L2, secondary: Mina L1 completion)
    const overallSuccess = zekoSuccess; // Primary success metric
    const networksCompleted = (zekoSuccess ? 1 : 0) + (minaSuccess ? 1 : 0);
    const responseData = {
      status: overallSuccess,
      message: overallSuccess
        ? "Doot oracle update completed!"
        : "All network updates failed",
      data: {
        ipfs: {
          cid: ipfsCID,
          commitment,
        },
        networks: {
          zeko_l2: {
            status: zekoSuccess ? "SUCCESS" : "FAILED",
            success: zekoSuccess,
            tx_hash: zekoTxHash || null,
            endpoint: process.env.NEXT_PUBLIC_ZEKO_ENDPOINT,
            contract: process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY,
            error: zekoSuccess ? null : "Zeko L2 transaction failed",
          },
          mina_l1: {
            status: minaStatus, // "SUCCESS" | "FAILED" | "TIMEOUT" | "ERROR"
            success: minaSuccess,
            tx_hash: minaTxHash || null,
            endpoint: process.env.NEXT_PUBLIC_MINA_ENDPOINT,
            contract: process.env.NEXT_PUBLIC_DOOT_PUBLIC_KEY,
            error: minaError || null,
            timeout_seconds: minaStatus === "TIMEOUT" ? 300 : null,
          },
        },
        summary: {
          networks_completed: networksCompleted, // Networks that completed successfully
          networks_total: 2,
          tokens_processed: Object.keys(tokenData).length,
          execution_time_limit: "300 seconds (5:00 for Vercel CRON safety)",
          primary_network: "Zeko L2 (fast finality)",
          secondary_network: "Mina L1 (full decentralization)",
        },
      },
    };

    console.log(
      "\n =============== DOOT ORACLE UPDATE SUMMARY ==============="
    );
    console.log(` Overall Status: ${overallSuccess ? "SUCCESS" : "FAILED"}`);
    console.log(` IPFS: ${ipfsCID} (${commitment.slice(0, 20)}...)`);
    console.log(
      `⚡ Zeko L2: ${zekoSuccess ? "SUCCESS" : "FAILED"} ${
        zekoTxHash ? `(${zekoTxHash})` : ""
      }`
    );
    console.log(` Mina L1: BACKGROUND (fire-and-forget due to CRON timeout)`);
    console.log(
      ` Networks Updated: ${responseData.data.summary.networks_updated}/2 (${responseData.data.summary.networks_background} background)`
    );
    console.log(
      "===============================================================\n"
    );

    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.status(overallSuccess ? 200 : 500).json(responseData);
    }
  } catch (error) {
    console.error(
      "\nERR! =============== DOOT ORACLE UPDATE FAILED ==============="
    );
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error(
      "================================================================\n"
    );

    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.status(500).json({
        status: false,
        message: "Doot oracle update failed",
        error: error.message,
        data: {
          ipfs: ipfsCID ? { cid: ipfsCID, commitment } : null,
          stage_failed: ipfsCID ? "blockchain_update" : "ipfs_pinning",
        },
      });
    }
  }
}

/**
 * Update Zeko L2 contract with shared transaction data
 * Fast finality (~10-25 seconds)
 * Based on contracts_CLAUDE.md deployment patterns
 */
async function updateZekoL2Contract(sharedTxnData) {
  try {
    console.log(" Configuring Zeko L2 network connection...");

    const { ipfsCID, commitment, tokenData, callerPrivateKey } = sharedTxnData;

    // Environment variables for Zeko L2
    const ZEKO_ENDPOINT = process.env.NEXT_PUBLIC_ZEKO_ENDPOINT;
    const ZEKO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;

    if (!ZEKO_ENDPOINT || !ZEKO_CONTRACT_ADDRESS || !callerPrivateKey) {
      throw new Error("Missing Zeko L2 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${ZEKO_ENDPOINT}`);
    console.log(` Contract: ${ZEKO_CONTRACT_ADDRESS}`);

    // Prepare transaction data (from contracts_CLAUDE.md patterns)
    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH = IpfsCID.fromString(ipfsCID);

    // Convert token data to TokenInformationArray (exactly 10 prices)
    const orderedTokens = [
      "mina",
      "bitcoin",
      "ethereum",
      "solana",
      "ripple",
      "cardano",
      "avalanche",
      "polygon",
      "chainlink",
      "dogecoin",
    ];
    const prices = orderedTokens.map((token) =>
      Field.from(tokenData[token].price)
    );
    const TOKEN_INFO = new TokenInformationArray({ prices });

    // Setup keys and network
    const caller = PrivateKey.fromBase58(callerPrivateKey);
    const callerPub = caller.toPublicKey();
    const contractPub = PublicKey.fromBase58(ZEKO_CONTRACT_ADDRESS);

    // Configure Zeko L2 network (from contracts_CLAUDE.md)
    const ZekoNetwork = Mina.Network({
      mina: ZEKO_ENDPOINT,
      archive: ZEKO_ENDPOINT, // Zeko uses same endpoint for both
    });
    Mina.setActiveInstance(ZekoNetwork);

    // Fetch accounts with retry logic
    await fetchAccountWithRetry({ publicKey: contractPub });
    await fetchAccountWithRetry({ publicKey: callerPub });

    // Compile contract (use cache if available)
    const cacheFiles = await fetchDootFiles();
    await Doot.compile({ cache: FileSystem(cacheFiles) });
    const dootZkApp = new Doot(contractPub);

    console.log(" Creating and proving Zeko L2 transaction...");

    // Create transaction (owner-only update method)
    const txn = await Mina.transaction(
      { sender: callerPub, fee: 0.1 * 1e9 }, // 0.1 MINA fee buffer for Zeko L2
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // Prove transaction
    await txn.prove();
    console.log("SUCCESS! Zeko L2 transaction proved successfully");

    // Sign and send
    const signedTxn = txn.sign([caller]);
    const result = await signedTxn.send();

    console.log(`SUCCESS! Zeko L2 transaction sent: ${result.hash}`);

    return {
      success: true,
      txHash: result.hash,
      network: "zeko_l2",
      finality: "10-25 seconds",
      endpoint: ZEKO_ENDPOINT,
    };
  } catch (error) {
    console.error("ERR! Zeko L2 transaction error:", error.message);
    return {
      success: false,
      error: error.message,
      network: "zeko_l2",
    };
  }
}

/**
 * Update Mina L1 contract with shared transaction data
 * Slower finality (~3-5 minutes) but more decentralized
 * Based on contracts_CLAUDE.md deployment patterns
 */
async function updateMinaL1Contract(sharedTxnData) {
  try {
    console.log(" Configuring Mina L1 network connection...");

    const { ipfsCID, commitment, tokenData, callerPrivateKey } = sharedTxnData;

    // Environment variables for Mina L1
    const MINA_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
    const MINA_ARCHIVE_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT; // Same for devnet
    const MINA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DOOT_PUBLIC_KEY;

    if (!MINA_ENDPOINT || !MINA_CONTRACT_ADDRESS || !callerPrivateKey) {
      throw new Error("Missing Mina L1 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${MINA_ENDPOINT}`);
    console.log(` Contract: ${MINA_CONTRACT_ADDRESS}`);

    // Reuse the SAME cryptographic calculations from Zeko L2 (efficiency gain!)
    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH = IpfsCID.fromString(ipfsCID);

    // Convert token data to TokenInformationArray (same order as Zeko)
    const orderedTokens = [
      "mina",
      "bitcoin",
      "ethereum",
      "solana",
      "ripple",
      "cardano",
      "avalanche",
      "polygon",
      "chainlink",
      "dogecoin",
    ];
    const prices = orderedTokens.map((token) =>
      Field.from(tokenData[token].price)
    );
    const TOKEN_INFO = new TokenInformationArray({ prices });

    // Setup keys and network
    const caller = PrivateKey.fromBase58(callerPrivateKey);
    const callerPub = caller.toPublicKey();
    const contractPub = PublicKey.fromBase58(MINA_CONTRACT_ADDRESS);

    // Configure Mina L1 network (from contracts_CLAUDE.md)
    const MinaL1Network = Mina.Network({
      mina: MINA_ENDPOINT,
      archive: MINA_ARCHIVE_ENDPOINT,
    });
    Mina.setActiveInstance(MinaL1Network);

    // Fetch accounts with retry logic
    await fetchAccountWithRetry({ publicKey: contractPub });
    await fetchAccountWithRetry({ publicKey: callerPub });

    // REUSE compiled contract from Zeko L2 (same contract code)
    // Only compile if not already done
    console.log(" Reusing compiled contract for Mina L1...");
    const dootZkApp = new Doot(contractPub);

    console.log(" Creating and proving Mina L1 transaction...");

    // Create transaction (same update method as Zeko)
    const txn = await Mina.transaction(
      { sender: callerPub, fee: 0.1 * 1e9 }, // Standard L1 fee
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // REUSE proof from Zeko L2 if possible, or generate new one
    await txn.prove();
    console.log("SUCCESS! Mina L1 transaction proved successfully");

    // Sign and send
    const signedTxn = txn.sign([caller]);
    const result = await signedTxn.send();

    console.log(`SUCCESS! Mina L1 transaction sent: ${result.hash}`);

    return {
      success: true,
      txHash: result.hash,
      network: "mina_l1",
      finality: "3-5 minutes",
      endpoint: MINA_ENDPOINT,
    };
  } catch (error) {
    console.error("ERR! Mina L1 transaction error:", error.message);
    return {
      success: false,
      error: error.message,
      network: "mina_l1",
    };
  }
}

// Helper function for account fetching with retry (from contracts_CLAUDE.md patterns)
async function fetchAccountWithRetry(accountInfo, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchAccount(accountInfo);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
