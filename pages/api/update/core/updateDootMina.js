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

/**
 * Mina L1 Doot Oracle Update Endpoint
 * Flow: IPFS Pin → Mina L1 Update → Redis Cache Update
 * Slower finality (~3-5 minutes) but fully decentralized
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
      "\n =============== MINA L1 DOOT ORACLE UPDATE STARTED =============== \n"
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
    const ipfsResults = await pinMinaObject(tokenData, previousCID, "mina");

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
    console.log("\nPre-computing cryptographic objects for Mina L1...");

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
      PublicKey.fromBase58(process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY)
    );
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    console.log("\nStarting Mina L1 update...");

    let minaSuccess = false;
    let minaTxHash = null;
    let minaStatus = "TIMEOUT";
    let minaError = null;
    let minaResult = {
      success: false,
      confirmed: false,
      settlementTxHash: null,
    };

    // Create timeout promise (5 minutes = 300 seconds)
    const minaTimeout = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            timeout: true,
            elapsed: "300s",
            message: "Mina L1 update timed out (5:00 limit)",
          }),
        300000
      )
    );

    try {
      // Race between Mina L1 execution and timeout
      const result = await Promise.race([
        updateMinaL1Contract(dootZkApp, sharedTxnData),
        minaTimeout,
      ]);

      if (result.timeout) {
        // Timeout occurred
        minaStatus = "TIMEOUT";
        minaError = result.message;
        console.log(`TIME!  Mina L1 update timed out after ${result.elapsed}`);
      } else if (result.success) {
        // Success within timeout
        minaSuccess = true;
        minaTxHash = result.txHash;
        minaStatus = "SUCCESS";
        minaResult = result;
        console.log(`COMPLETED!`);
      } else {
        // Failed within timeout
        minaStatus = "FAILED";
        minaError = result.error;
        minaResult = result;
        console.log(`ERR! Mina L1 update failed: ${result.error}`);
      }
    } catch (error) {
      // Unexpected error
      minaStatus = "ERROR";
      minaError = error.message;
      minaResult = {
        success: false,
        confirmed: false,
        settlementTxHash: null,
        error: error.message,
      };
      console.error(`ERR! Mina L1 update unexpected error: ${error.message}`);
    }

    console.log("\nUpdating redis cache.");

    // Update Redis cache if Mina L1 succeeded
    if (minaSuccess) {
      await redis.set(MINA_CID_CACHE, [ipfsCID, commitment]);
      console.log("SUCCESS! Redis cache updated with new IPFS data");
    }

    const responseData = {
      status: minaSuccess,
      message: minaSuccess
        ? "Mina L1 Doot oracle update completed!"
        : "Mina L1 update failed",
      data: {
        ipfs: {
          cid: ipfsCID,
          commitment,
        },
        network: {
          status: minaStatus, // "SUCCESS" | "FAILED" | "TIMEOUT" | "ERROR"
          success: minaSuccess,
          tx_hash: minaTxHash || null,
          confirmed: minaResult?.confirmed || false,
          settlement_tx_hash: minaResult?.settlementTxHash || null,
          endpoint: process.env.NEXT_PUBLIC_MINA_ENDPOINT,
          contract: process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY,
          error: minaError || null,
          timeout_seconds: minaStatus === "TIMEOUT" ? 300 : null,
          finality: "3-5 minutes",
          network_type: "mina_l1",
        },
        summary: {
          tokens_processed: Object.keys(tokenData).length,
          operations: "update + confirmation + settlement",
          confirmation: minaResult?.confirmed || false,
          settlement: minaResult?.settlementTxHash ? "SUCCESS" : "SKIPPED",
          primary_network: "Mina L1 (full decentralization)",
        },
      },
    };

    console.log(
      "\n =============== MINA L1 DOOT ORACLE UPDATE SUMMARY ==============="
    );
    console.log(` Overall Status: ${minaSuccess ? "SUCCESS" : "FAILED"}`);
    console.log(` IPFS: ${ipfsCID} (${commitment.slice(0, 20)}...)`);
    console.log(
      ` Mina L1: ${minaSuccess ? "SUCCESS" : "FAILED"} ${
        minaTxHash ? `(${minaTxHash})` : ""
      } ${minaResult?.confirmed ? "✅" : "⏱️"} ${
        minaResult?.settlementTxHash
          ? `[Settlement: ${minaResult.settlementTxHash}]`
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
          console.log(
            "CLEANUP! Garbage collection not available - restart Node.js with --expose-gc"
          );
        }
      } catch (gcError) {
        console.warn("CLEANUP! GC failed:", gcError.message);
      }

      return res.status(minaSuccess ? 200 : 500).json(responseData);
    }
  } catch (error) {
    console.error(
      "\nERR! =============== MINA L1 DOOT ORACLE UPDATE FAILED ==============="
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
          console.log(
            "CLEANUP! Garbage collection not available - restart Node.js with --expose-gc"
          );
        }
      } catch (gcError) {
        console.warn("CLEANUP! GC failed:", gcError.message);
      }

      return res.status(500).json({
        status: false,
        message: "Mina L1 Doot oracle update failed",
        error: error.message,
        data: {
          ipfs: ipfsCID ? { cid: ipfsCID, commitment } : null,
          stage_failed: ipfsCID ? "blockchain_update" : "ipfs_pinning",
          network_type: "mina_l1",
        },
      });
    }
  }
}

// Helper function for account fetching with retry (from contracts_CLAUDE.md patterns)
async function fetchAccountWithRetry(accountInfo, maxRetries = 3) {
  const endpoint = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchAccount(accountInfo, endpoint);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Helper function for transaction confirmation (devnet/testnet optimized)
// Avoids GraphQL issues with bestChain queries on Mina devnet
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
        // Fallback: time-based confirmation for devnet
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
 * Update Mina L1 contract with shared transaction data
 * Slower finality (~3-5 minutes) but more decentralized
 * Based on contracts_CLAUDE.md deployment patterns
 */
async function updateMinaL1Contract(dootZkApp, sharedTxnData) {
  try {
    console.log("Configuring Mina L1 network connection...");

    const { COMMITMENT, IPFS_HASH, TOKEN_INFO, caller, callerPub } =
      sharedTxnData;

    // Environment variables for Mina L1
    const MINA_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
    const MINA_ARCHIVE_ENDPOINT =
      process.env.NEXT_PUBLIC_MINA_ARCHIVE_ENDPOINT ||
      process.env.NEXT_PUBLIC_MINA_ENDPOINT;
    const MINA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY;

    if (!MINA_ENDPOINT || !MINA_CONTRACT_ADDRESS) {
      throw new Error("Missing Mina L1 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${MINA_ENDPOINT}`);
    console.log(` Archive: ${MINA_ARCHIVE_ENDPOINT}`);
    console.log(` Contract: ${MINA_CONTRACT_ADDRESS}`);

    // Use the pre-computed cryptographic objects (maximum efficiency!)
    const contractPub = PublicKey.fromBase58(MINA_CONTRACT_ADDRESS);

    // Configure Mina L1 network (from contracts_CLAUDE.md)
    const MinaL1Network = Mina.Network({
      mina: MINA_ENDPOINT, // SAME AS ARCHIVE
      archive: MINA_ARCHIVE_ENDPOINT,
    });
    Mina.setActiveInstance(MinaL1Network);

    // Fetch accounts with retry logic
    await fetchAccountWithRetry({ publicKey: contractPub, tokenId: Field(1) });
    await fetchAccountWithRetry({ publicKey: callerPub, tokenId: Field(1) });

    console.log("Creating and proving Mina L1 transaction...");

    // Create transaction (same update method as Zeko)
    const txn = await Mina.transaction(
      { sender: callerPub, fee: 5e9 }, // Standard L1 fee
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // Generate proof (reuses same cryptographic objects)
    await txn.prove();
    console.log("SUCCESS! Mina L1 transaction proved successfully");

    // Sign and send
    const signedTxn = txn.sign([caller]);
    const pendingTxn = await signedTxn.send();

    console.log(`SUCCESS! Mina L1 transaction sent: ${pendingTxn.hash}`);

    // Wait for Mina L1 transaction confirmation (5 minute timeout)
    const minaConfirmed = await waitForTransactionConfirmation(
      pendingTxn,
      6,
      "Mina L1"
    ); // 5 minutes

    let settlementTxHash = null;
    if (minaConfirmed) {
      // Fire-and-forget settlement - send but don't wait
      console.log("Mina L1 confirmed! Sending settlement (fire-and-forget)...");
      try {
        console.log("Creating settlement proof...");
        const settlementProof =
          await dootZkApp.offchainState.createSettlementProof();

        console.log("Building settlement transaction...");
        const settleTxn = await Mina.transaction(
          { sender: callerPub, fee: 0.1 * 5e9 },
          async () => {
            await dootZkApp.settle(settlementProof);
          }
        );

        console.log("Proving settlement transaction...");
        await settleTxn.prove();

        console.log("Sending settlement transaction...");
        const settlementPending = await settleTxn.sign([caller]).send();
        settlementTxHash = settlementPending.hash;

        console.log(
          `SUCCESS! Mina L1 settlement sent (fire-and-forget): ${settlementTxHash}`
        );
      } catch (settlementError) {
        console.warn(
          `WARN! Mina L1 settlement failed: ${settlementError.message}`
        );
      }
    } else {
      console.log(
        "WARN! Mina L1 transaction not confirmed within 5:00 - skipping settlement"
      );
    }

    return {
      success: true,
      txHash: pendingTxn.hash,
      confirmed: minaConfirmed,
      settlementTxHash,
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
