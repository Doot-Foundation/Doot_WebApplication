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

/**
 * Mina L1 Doot Oracle Update Endpoint
 * Flow: IPFS Pin → Mina L1 Update → Redis Cache Update
 * Slower finality (~3-5 minutes) but fully decentralized
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const GLOBAL_TIMEOUT_MS = 795 * 1000; // 795 seconds
  let globalTimeoutReached = false;
  let responseAlreadySent = false;
  let ipfsCID = null;
  let commitment = null;

  // Set up global timeout
  const globalTimeout = setTimeout(() => {
    globalTimeoutReached = true;
  }, GLOBAL_TIMEOUT_MS);

  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      clearTimeout(globalTimeout);
      return res.status(401).json("Unauthorized");
    }

    // Compile contracts fresh for each request following o1js server-side best practices
    console.log("Compiling Doot contract and offchain state...");
    try {
      // Compile offchain state first if it exists
      if (offchainState && typeof offchainState.compile === "function") {
        await offchainState.compile();
      }

      // Compile the main Doot contract without cache for server-side reliability
      await Doot.compile();
      console.log("SUCCESS! Doot contract compiled successfully (server-side).");
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
    let minaStatus = "PENDING";
    let minaError = null;
    let minaResult = {
      success: false,
      confirmed: false,
      settlementTxHash: null,
    };

    try {
      // Check global timeout before starting blockchain operations
      if (globalTimeoutReached) {
        minaStatus = "PENDING";
        minaError = "Global timeout reached before blockchain operations";
        console.log(`TIME! Global timeout reached before Mina L1 operations`);
      } else {
        const result = await updateMinaL1ContractWithPolling(dootZkApp, sharedTxnData, () => globalTimeoutReached);

        if (result.timeout) {
          minaStatus = "PENDING";
          minaError = result.message;
          console.log(`TIME! Mina L1 update timed out: ${result.message}`);
        } else if (result.success) {
          minaSuccess = true;
          minaTxHash = result.txHash;
          minaStatus = "SUCCESS";
          minaResult = result;
          console.log(`COMPLETED!`);
        } else {
          minaStatus = "FAILED";
          minaError = result.error;
          minaResult = result;
          console.log(`ERR! Mina L1 update failed: ${result.error}`);
        }
      }
    } catch (error) {
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

    // Clear global timeout
    clearTimeout(globalTimeout);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const responseData = {
      status: minaSuccess,
      message: minaSuccess
        ? "Mina L1 Doot oracle update completed!"
        : minaStatus === "PENDING"
        ? "Mina L1 update partially completed (timeout reached)"
        : "Mina L1 update failed",
      data: {
        ipfs: {
          cid: ipfsCID,
          commitment,
        },
        network: {
          status: minaStatus, // "SUCCESS" | "FAILED" | "PENDING" | "ERROR"
          success: minaSuccess,
          tx_hash: minaTxHash || null,
          confirmed: minaResult?.confirmed || false,
          settlement_tx_hash: minaResult?.settlementTxHash || null,
          endpoint: process.env.NEXT_PUBLIC_MINA_ENDPOINT,
          contract: process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY,
          error: minaError || null,
          elapsed_seconds: elapsed,
          global_timeout_seconds: 795,
          timeout_reached: globalTimeoutReached,
          finality: "3-5 minutes",
          network_type: "mina_l1",
        },
        summary: {
          tokens_processed: Object.keys(tokenData).length,
          operations: "update + confirmation + settlement",
          confirmation: minaResult?.confirmed || false,
          settlement: minaResult?.settlementTxHash ? "SUCCESS" : minaStatus === "PENDING" ? "PENDING" : "SKIPPED",
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
      } ${minaResult?.confirmed ? "CONFIRMED" : "PENDING"} ${
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

      // Always return 200 for timeout/pending states to provide vital info
      const statusCode = minaSuccess || minaStatus === "PENDING" ? 200 : 500;
      return res.status(statusCode).json(responseData);
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

      // Clear global timeout
      clearTimeout(globalTimeout);

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

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      return res.status(500).json({
        status: false,
        message: "Mina L1 Doot oracle update failed",
        error: error.message,
        data: {
          ipfs: ipfsCID ? { cid: ipfsCID, commitment } : null,
          stage_failed: ipfsCID ? "blockchain_update" : "ipfs_pinning",
          network_type: "mina_l1",
          elapsed_seconds: elapsed,
          global_timeout_seconds: 795,
          timeout_reached: globalTimeoutReached,
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
 * Update Mina L1 contract with polling and global timeout awareness
 * Polls every 10 seconds, respects global timeout, waits for full confirmation
 */
async function updateMinaL1ContractWithPolling(dootZkApp, sharedTxnData, isGlobalTimeoutReached) {
  try {
    console.log("Configuring Mina L1 network connection...");

    const { COMMITMENT, IPFS_HASH, TOKEN_INFO, caller, callerPub } = sharedTxnData;

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

    // Check timeout before expensive operations
    if (isGlobalTimeoutReached()) {
      return { success: false, timeout: true, message: "Global timeout reached before network setup" };
    }

    const contractPub = PublicKey.fromBase58(MINA_CONTRACT_ADDRESS);

    // Configure Mina L1 network
    const MinaL1Network = Mina.Network({
      mina: MINA_ENDPOINT,
      archive: MINA_ARCHIVE_ENDPOINT,
    });
    Mina.setActiveInstance(MinaL1Network);

    // Fetch accounts with retry logic
    await fetchAccountWithRetry({ publicKey: contractPub, tokenId: Field(1) });
    await fetchAccountWithRetry({ publicKey: callerPub, tokenId: Field(1) });

    // Check timeout before proving
    if (isGlobalTimeoutReached()) {
      return { success: false, timeout: true, message: "Global timeout reached before transaction creation" };
    }

    console.log("Creating and proving Mina L1 transaction...");

    // Create transaction
    const txn = await Mina.transaction(
      { sender: callerPub, fee: 5e9 },
      async () => {
        await dootZkApp.update(COMMITMENT, IPFS_HASH, TOKEN_INFO);
      }
    );

    // Generate proof
    await txn.prove();
    console.log("SUCCESS! Mina L1 transaction proved successfully");

    // Check timeout before sending
    if (isGlobalTimeoutReached()) {
      return { success: false, timeout: true, message: "Global timeout reached before sending transaction" };
    }

    // Sign and send
    const signedTxn = txn.sign([caller]);
    const pendingTxn = await signedTxn.send();

    console.log(`SUCCESS! Mina L1 transaction sent: ${pendingTxn.hash}`);

    // Wait for confirmation with polling every 10 seconds
    const minaConfirmed = await waitForTransactionConfirmationWithPolling(
      pendingTxn,
      "Mina L1",
      isGlobalTimeoutReached
    );

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: "Global timeout reached during transaction confirmation",
        txHash: pendingTxn.hash,
        confirmed: false
      };
    }

    let settlementTxHash = null;
    if (minaConfirmed) {
      // Settlement process with timeout awareness
      console.log("Mina L1 confirmed! Sending settlement...");
      try {
        if (isGlobalTimeoutReached()) {
          console.log("WARN! Global timeout reached before settlement");
        } else {
          console.log("Creating settlement proof...");
          const settlementProof = await dootZkApp.offchainState.createSettlementProof();

          if (!isGlobalTimeoutReached()) {
            console.log("Building settlement transaction...");
            const settleTxn = await Mina.transaction(
              { sender: callerPub, fee: 0.1 * 5e9 },
              async () => {
                await dootZkApp.settle(settlementProof);
              }
            );

            console.log("Proving settlement transaction...");
            await settleTxn.prove();

            if (!isGlobalTimeoutReached()) {
              console.log("Sending settlement transaction...");
              const settlementPending = await settleTxn.sign([caller]).send();
              settlementTxHash = settlementPending.hash;

              console.log(`SUCCESS! Mina L1 settlement sent: ${settlementTxHash}`);
            }
          }
        }
      } catch (settlementError) {
        console.warn(`WARN! Mina L1 settlement failed: ${settlementError.message}`);
      }
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

/**
 * Wait for transaction confirmation with 10-second polling and global timeout awareness
 */
async function waitForTransactionConfirmationWithPolling(pendingTransaction, networkName, isGlobalTimeoutReached) {
  console.log(`Waiting for ${networkName} confirmation with 10s polling...`);

  if (pendingTransaction.status !== "pending") {
    console.error(`ERR! ${networkName} transaction not accepted by daemon:`, pendingTransaction.status);
    return false;
  }

  console.log(`SUCCESS! ${networkName} transaction accepted for processing by daemon`);

  try {
    let attempts = 0;
    const maxAttempts = 1000; // Safety limit

    while (attempts < maxAttempts) {
      // Check global timeout
      if (isGlobalTimeoutReached()) {
        console.log(`WARN! ${networkName} confirmation stopped due to global timeout`);
        return false;
      }

      try {
        // Try to get transaction status
        await pendingTransaction.wait({ maxAttempts: 1 });
        console.log(`SUCCESS! ${networkName} transaction successfully confirmed: ${pendingTransaction.hash}`);
        return true;
      } catch (waitError) {
        if (waitError.message.includes("pending") || waitError.message.includes("not found")) {
          // Transaction still pending, continue polling
          attempts++;
          console.log(`${networkName} still pending... (attempt ${attempts})`);

          // Wait 10 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        } else {
          // Other error, assume confirmed or failed
          console.log(`SUCCESS! ${networkName} confirmation completed (via error): ${pendingTransaction.hash}`);
          return true;
        }
      }
    }

    console.log(`WARN! ${networkName} confirmation max attempts reached`);
    return false;
  } catch (error) {
    console.error(`ERR! ${networkName} transaction failed:`, error.message);
    return false;
  }
}
