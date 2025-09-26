import { redis } from "@/utils/helper/init/InitRedis.js";

import { TOKEN_TO_CACHE, ZEKO_CID_CACHE } from "@/utils/constants/info.js";

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

/**
 * Zeko L2 Doot Oracle Update Endpoint
 * Flow: IPFS Pin → Zeko L2 Update → Redis Cache Update
 * Optimized for fast finality (~10-25 seconds)
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

    // Compile contracts fresh for each request to avoid WASM aliasing
    console.log("Compiling Doot contract and offchain state...");
    const cacheFiles = await fetchDootFiles();
    try {
      if (offchainState && typeof offchainState.compile === "function") {
        await offchainState.compile({ cache: FileSystem(cacheFiles) });
      }
      await Doot.compile({ cache: FileSystem(cacheFiles) });
      console.log("SUCCESS! Doot contract compiled using cache.");
    } catch (compileErr) {
      console.error("ERR! Contract compilation failed:", compileErr.message);
      throw new Error(`Contract compilation failed: ${compileErr.message}`);
    }

    console.log(
      "\n =============== ZEKO L2 DOOT ORACLE UPDATE STARTED =============== \n"
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
      const existingMinaCacheData = await redis.get(ZEKO_CID_CACHE);
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
    const ipfsResults = await pinMinaObject(tokenData, previousCID, "zeko");

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

    // Pre-compute shared cryptographic objects
    console.log("\nPre-computing cryptographic objects for Zeko L2...");

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
      PublicKey.fromBase58(process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY)
    );
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    console.log("\nStarting Zeko L2 update...");

    let zekoSuccess = false;
    let zekoTxHash = null;
    let zekoResult = {
      success: false,
      confirmed: false,
      settlementTxHash: null,
    };

    try {
      zekoResult = await updateZekoL2Contract(dootZkApp, sharedTxnData);
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
      zekoResult = {
        success: false,
        confirmed: false,
        settlementTxHash: null,
        error: error.message,
      };
    }

    console.log("\nUpdating redis cache.");

    // Update Redis cache if Zeko L2 succeeded
    if (zekoSuccess) {
      await redis.set(ZEKO_CID_CACHE, [ipfsCID, commitment]);
      console.log("SUCCESS! Redis cache updated with new IPFS data");
    }

    const responseData = {
      status: zekoSuccess,
      message: zekoSuccess
        ? "Zeko L2 Doot oracle update completed!"
        : "Zeko L2 update failed",
      data: {
        ipfs: {
          cid: ipfsCID,
          commitment,
        },
        network: {
          status: zekoSuccess ? "SUCCESS" : "FAILED",
          success: zekoSuccess,
          tx_hash: zekoTxHash || null,
          confirmed: zekoResult?.confirmed || false,
          settlement_tx_hash: zekoResult?.settlementTxHash || null,
          endpoint: process.env.NEXT_PUBLIC_ZEKO_ENDPOINT,
          contract: process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY,
          error: zekoSuccess ? null : "Zeko L2 transaction failed",
          finality: "10-25 seconds",
          network_type: "zeko_l2",
        },
        summary: {
          tokens_processed: Object.keys(tokenData).length,
          operations: "update + confirmation + settlement",
          confirmation: zekoResult?.confirmed || false,
          settlement: zekoResult?.settlementTxHash ? "SUCCESS" : "SKIPPED",
          primary_network: "Zeko L2 (fast finality)",
        },
      },
    };

    console.log(
      "\n=============== ZEKO L2 DOOT ORACLE UPDATE SUMMARY ==============="
    );
    console.log(` Overall Status: ${zekoSuccess ? "SUCCESS" : "FAILED"}`);
    console.log(` IPFS: ${ipfsCID} (${commitment.slice(0, 20)}...)`);
    console.log(
      ` Zeko L2: ${zekoSuccess ? "SUCCESS" : "FAILED"} ${
        zekoTxHash ? `(${zekoTxHash})` : ""
      } ${zekoResult?.confirmed ? "✅" : "⏱️"} ${
        zekoResult?.settlementTxHash
          ? `[Settlement: ${zekoResult.settlementTxHash}]`
          : ""
      }`
    );
    console.log(
      ` Tokens Processed: ${responseData.data.summary.tokens_processed}/10`
    );
    console.log(
      "===============================================================\n"
    );

    if (!responseAlreadySent) {
      responseAlreadySent = true;

      // CRITICAL: Force garbage collection to prevent WASM aliasing between requests
      try {
        if (global.gc) {
          global.gc();
          console.log("CLEANUP! Forced garbage collection completed");
        } else {
          console.log("CLEANUP! Garbage collection not available - restart Node.js with --expose-gc");
        }
      } catch (gcError) {
        console.warn("CLEANUP! GC failed:", gcError.message);
      }

      return res.status(zekoSuccess ? 200 : 500).json(responseData);
    }
  } catch (error) {
    console.error(
      "\nERR! =============== ZEKO L2 DOOT ORACLE UPDATE FAILED ==============="
    );
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error(
      "================================================================\n"
    );

    if (!responseAlreadySent) {
      responseAlreadySent = true;

      // CRITICAL: Force garbage collection to prevent WASM aliasing between requests
      try {
        if (global.gc) {
          global.gc();
          console.log("CLEANUP! Forced garbage collection completed");
        } else {
          console.log("CLEANUP! Garbage collection not available - restart Node.js with --expose-gc");
        }
      } catch (gcError) {
        console.warn("CLEANUP! GC failed:", gcError.message);
      }

      return res.status(500).json({
        status: false,
        message: "Zeko L2 Doot oracle update failed",
        error: error.message,
        data: {
          ipfs: ipfsCID ? { cid: ipfsCID, commitment } : null,
          stage_failed: ipfsCID ? "blockchain_update" : "ipfs_pinning",
          network_type: "zeko_l2",
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

// Helper function for transaction confirmation (devnet/testnet optimized)
// Avoids GraphQL issues with bestChain queries on Zeko devnet
async function waitForTransactionConfirmation(
  pendingTransaction,
  timeoutMinutes,
  networkName
) {
  console.log(
    `⏳ Waiting for ${networkName} confirmation (${timeoutMinutes}:00 timeout)...`
  );

  if (pendingTransaction.status !== "pending") {
    console.error(
      `❌ ${networkName} transaction not accepted by daemon:`,
      pendingTransaction.status
    );
    return false;
  }

  console.log(
    `✅ ${networkName} transaction accepted for processing by daemon`
  );

  try {
    // For devnet/testnet: Use timeout-based confirmation to avoid GraphQL issues
    const timeoutMs = timeoutMinutes * 60 * 1000;

    // Try pendingTransaction.wait() but fallback to timeout if GraphQL fails
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Confirmation timeout after ${timeoutMinutes}:00`)
            ),
          timeoutMs
        )
      );

      await Promise.race([pendingTransaction.wait(), timeout]);

      console.log(
        `✅ ${networkName} transaction successfully included in block: ${pendingTransaction.hash}`
      );
      return true;
    } catch (waitError) {
      if (
        waitError.message.includes("bestChain") ||
        waitError.message.includes("GraphQL")
      ) {
        console.log(` GraphQL issue detected, using time-based confirmation.`);
        await new Promise((resolve) => setTimeout(resolve, timeoutMs));
        console.log(
          `✅ ${networkName} time-based confirmation completed: ${pendingTransaction.hash}`
        );
        return true;
      } else if (waitError.message.includes("timeout")) {
        console.log(
          `⏱️ ${networkName} confirmation timed out (${timeoutMinutes}:00): ${pendingTransaction.hash}`
        );
        return false;
      } else {
        throw waitError; // Re-throw other errors
      }
    }
  } catch (error) {
    console.error(`❌ ${networkName} transaction failed:`, error.message);
    return false;
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

    const { COMMITMENT, IPFS_HASH, TOKEN_INFO, caller, callerPub } =
      sharedTxnData;

    // Environment variables for Zeko L2
    const ZEKO_ENDPOINT = process.env.NEXT_PUBLIC_ZEKO_ENDPOINT;
    const ZEKO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;

    if (!ZEKO_ENDPOINT || !ZEKO_CONTRACT_ADDRESS) {
      throw new Error("Missing Zeko L2 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${ZEKO_ENDPOINT}`);
    console.log(` Archive: ${ZEKO_ENDPOINT}`);
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
      { sender: callerPub, fee: 0.1 * 5e9 }, // 0.1 MINA fee buffer for Zeko L2
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // Prove transaction
    await txn.prove();
    console.log("SUCCESS! Zeko L2 transaction proved successfully");

    // Sign and send
    const signedTxn = txn.sign([caller]);
    const pendingTxn = await signedTxn.send();

    console.log(`SUCCESS! Zeko L2 transaction sent: ${pendingTxn.hash}`);

    // Wait for Zeko L2 transaction confirmation (fast finality)
    const zekoConfirmed = await waitForTransactionConfirmation(
      pendingTxn,
      1,
      "Zeko L2"
    ); // 1 minute timeout

    let settlementTxHash = null;
    if (zekoConfirmed) {
      // Fire-and-forget settlement - send but don't wait
      console.log("Zeko L2 confirmed! Sending settlement (fire-and-forget)...");
      try {
        // Create fresh contract instance to avoid WASM aliasing
        const freshContractPub = PublicKey.fromBase58(ZEKO_CONTRACT_ADDRESS);
        const freshDootZkApp = new Doot(freshContractPub);
        freshDootZkApp.offchainState.setContractInstance(freshDootZkApp);

        console.log("Creating settlement proof...");
        const settlementProof =
          await freshDootZkApp.offchainState.createSettlementProof();

        console.log("Building settlement transaction...");
        const settleTxn = await Mina.transaction(
          { sender: callerPub, fee: 0.1 * 5e9 },
          async () => {
            await freshDootZkApp.settle(settlementProof);
          }
        );

        console.log("Proving settlement transaction...");
        await settleTxn.prove();

        console.log("Sending settlement transaction...");
        const settlementPending = await settleTxn.sign([caller]).send();
        settlementTxHash = settlementPending.hash;

        console.log(
          `SUCCESS! Zeko L2 settlement sent (fire-and-forget): ${settlementTxHash}`
        );
      } catch (settlementError) {
        console.warn(
          `WARN! Zeko L2 settlement failed: ${settlementError.message}`
        );
        console.warn(`Settlement error stack:`, settlementError.stack);
      }
    } else {
      console.log(
        "WARN! Zeko L2 transaction not confirmed - skipping settlement"
      );
    }

    return {
      success: true,
      txHash: pendingTxn.hash,
      confirmed: zekoConfirmed,
      settlementTxHash,
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
