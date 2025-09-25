import { redis } from "@/utils/helper/init/InitRedis.js";

import { TOKEN_TO_CACHE, MINA_CID_CACHE } from "@/utils/constants/info.js";

import pinMinaObject from "@/utils/helper/PinMinaObject";
import axios from "axios";

// Import o1js and contract utilities (from contracts_CLAUDE.md)
import { Mina, PrivateKey, Field, fetchAccount, PublicKey } from "o1js";
import {
  Doot,
  IpfsCID,
  TokenInformationArray,
  offchainState,
} from "@/utils/constants/Doot.js";
import { FileSystem, fetchDootFiles } from "@/utils/helper/LoadCache";

// async function zkappInit() {
const cacheFiles = await fetchDootFiles();
// console.log("Compiling initiated.");
try {
  if (offchainState && typeof offchainState.compile === "function") {
    await offchainState.compile({ cache: FileSystem(cacheFiles) });
  }
  await Doot.compile({ cache: FileSystem(cacheFiles) });
  console.log("SUCCESS! Doot contract compiled using cache.");
} catch (err) {
  console.log(err);
}
// }

/**
 * Combined Doot Oracle Update Endpoint
 * Flow: IPFS Pin → Zeko L2 Update → Mina L1 Update
 * Reuses cryptographic calculations for both networks
 */
export default async function handler(req, res) {
  let responseAlreadySent = false;
  let ipfsCID = null;
  let commitment = null;
  // await zkappInit();

  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    console.log(
      "\n =============== DOOT ORACLE UPDATE STARTED =============== \n"
    );

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
        console.log(`Found previous CID for unpinning: ${previousCID}`);
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
    console.log(`\nSUCCESS! IPFS pinning successful:`);
    console.log(` CID: ${ipfsCID}`);
    console.log(` Commitment: ${commitment}`);

    // Verify IPFS data is accessible
    console.log("Verifying IPFS data accessibility...");
    await verifyIpfsAccessibility(ipfsCID);
    console.log("SUCCESS! IPFS data verification successful");

    // Pre-compute shared cryptographic objects to eliminate redundancy
    console.log("\nPre-computing shared cryptographic objects...");

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

    // Pre-compute keys
    const caller = PrivateKey.fromBase58(process.env.DOOT_CALLER_KEY);
    const callerPub = caller.toPublicKey();

    const sharedTxnData = {
      // Pre-computed o1js objects (expensive to create)
      COMMITMENT,
      IPFS_HASH,
      TOKEN_INFO,
      caller,
      callerPub,
      // Raw data for logging
      ipfsCID,
      commitment,
    };

    const dootZkApp = new Doot(
      PublicKey.fromBase58(process.env.NEXT_PUBLIC_DOOT_PUBLIC_KEY)
    );
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    console.log("\nUpdating Zeko L2 contract...");

    let zekoSuccess = false;
    let zekoTxHash = null;

    try {
      const zekoResult = await updateZekoL2Contract(dootZkApp, sharedTxnData);
      zekoSuccess = zekoResult.success;
      zekoTxHash = zekoResult.txHash;

      if (zekoSuccess) {
        console.log(`COMPLETED!`);
      } else {
        console.log(`ERR! Zeko L2 update failed: ${zekoResult.error}`);
      }
    } catch (error) {
      console.error(`ERR! Zeko L2 update error: ${error.message}`);
      zekoSuccess = false;
    }

    console.log("\nStarting Mina L1 update with 5:00 timeout...");

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
        updateMinaL1Contract(dootZkApp, sharedTxnData),
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
        console.log(`COMPLETED!`);
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

    console.log("\nUpdating redis cache.");

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
      ` Zeko L2: ${zekoSuccess ? "SUCCESS" : "FAILED"} ${
        zekoTxHash ? `(${zekoTxHash})` : ""
      }`
    );
    console.log(
      ` Mina L1: ${minaSuccess ? "SUCCESS" : "FAILED"} ${
        minaTxHash ? `(${minaTxHash})` : ""
      }`
    );
    console.log(
      ` Networks Completed: ${responseData.data.summary.networks_completed}/${responseData.data.summary.networks_total}`
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
// Local helper: verify IPFS data availability to avoid ESM/CJS interop issues
async function verifyIpfsAccessibility(cid) {
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!GATEWAY) throw new Error("Missing NEXT_PUBLIC_PINATA_GATEWAY");
  try {
    const response = await axios.get(`https://${GATEWAY}/ipfs/${cid}`, {
      timeout: 10000,
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    throw new Error(`Failed to fetch IPFS data for CID ${cid}: ${msg}`);
  }
}

/**
 * Update Zeko L2 contract with shared transaction data
 * Fast finality (~10-25 seconds)
 * Based on contracts_CLAUDE.md deployment patterns
 */
async function updateZekoL2Contract(dootZkApp, sharedTxnData) {
  try {
    console.log("Configuring Zeko L2 network connection...");

    const { COMMITMENT, IPFS_HASH, TOKEN_INFO, caller, callerPub, ipfsCID } =
      sharedTxnData;

    // Environment variables for Zeko L2
    const ZEKO_ENDPOINT = process.env.NEXT_PUBLIC_ZEKO_ENDPOINT;
    const ZEKO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;

    if (!ZEKO_ENDPOINT || !ZEKO_CONTRACT_ADDRESS) {
      throw new Error("Missing Zeko L2 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${ZEKO_ENDPOINT}`);
    console.log(` Contract: ${ZEKO_CONTRACT_ADDRESS}`);

    // Use pre-computed objects (no redundant Field.from() calls)
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

    console.log("Creating and proving Zeko L2 transaction...");

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
async function updateMinaL1Contract(dootZkApp, sharedTxnData) {
  try {
    console.log("Configuring Mina L1 network connection...");

    const { COMMITMENT, IPFS_HASH, TOKEN_INFO, caller, callerPub, ipfsCID } =
      sharedTxnData;

    // Environment variables for Mina L1
    const MINA_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
    const MINA_ARCHIVE_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT; // Same for devnet
    const MINA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DOOT_PUBLIC_KEY;

    if (!MINA_ENDPOINT || !MINA_CONTRACT_ADDRESS) {
      throw new Error("Missing Mina L1 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${MINA_ENDPOINT}`);
    console.log(` Contract: ${MINA_CONTRACT_ADDRESS}`);

    // Use the SAME pre-computed cryptographic objects (maximum efficiency!)
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

    console.log("Creating and proving Mina L1 transaction...");

    // Create transaction (same update method as Zeko)
    const txn = await Mina.transaction(
      { sender: callerPub, fee: 0.1 * 1e9 }, // Standard L1 fee
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // Generate proof (reuses same cryptographic objects)
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
