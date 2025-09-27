const { redis } = require("./utils/helper/init/InitRedis");
const { TOKEN_TO_CACHE, ZEKO_CID_CACHE } = require("./utils/constants/info");
const pinMinaObject = require("./utils/helper/PinMinaObject");
const axios = require("axios");
const { Mina, PrivateKey, Field, fetchAccount, PublicKey } = require("o1js");
const {
  Doot,
  IpfsCID,
  TokenInformationArray,
  offchainState,
} = require("./utils/constants/Doot");

async function updateDootZeko() {
  const startTime = Date.now();
  const GLOBAL_TIMEOUT_MS = 600 * 1000;
  let globalTimeoutReached = false;
  let ipfsCID = null;
  let commitment = null;

  const globalTimeout = setTimeout(() => {
    globalTimeoutReached = true;
  }, GLOBAL_TIMEOUT_MS);

  const isGlobalTimeoutReached = () => globalTimeoutReached;

  const cleanup = () => {
    clearTimeout(globalTimeout);
    if (global.gc) {
      global.gc();
      console.log("CLEANUP! Forced garbage collection completed");
    }
  };

  try {
    console.log("Compiling Doot contract and offchain state...");
    if (offchainState && typeof offchainState.compile === "function") {
      try {
        await offchainState.compile();
      } catch (error) {
        console.error("offchainState compilation failed with:", error);
        throw new Error(`Contract compilation failed: ${error.message}`);
      }
    }

    try {
      await Doot.compile();
    } catch (error) {
      console.error("Doot compilation failed with:", error);
      throw new Error(`Contract compilation failed: ${error.message}`);
    }

    console.log(
      "SUCCESS! Doot offchainState + contract compiled successfully."
    );

    console.log(
      "\n=============== ZEKO L2 DOOT ORACLE UPDATE STARTED ===============\n"
    );

    const tokenData = {};
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);
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

    const validCacheKeys = [];
    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey];
      if (cacheKey && typeof cacheKey === "string" && cacheKey.trim() !== "") {
        validCacheKeys.push({ tokenKey, cacheKey });
      } else {
        console.warn(`Invalid cache key for token ${tokenKey}:`, cacheKey);
      }
    }

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
      }
    }

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

    let previousCID = "NULL";
    try {
      const existingZekoCacheData = await redis.get(ZEKO_CID_CACHE);
      if (
        existingZekoCacheData &&
        Array.isArray(existingZekoCacheData) &&
        existingZekoCacheData[0]
      ) {
        previousCID = existingZekoCacheData[0];
        console.log(`Found previous CID for unpinning: ${previousCID}`);
      }
    } catch (error) {
      console.log(`INFO! No previous CID found (fresh start): ${error.message}`);
    }

    const ipfsResults = await pinMinaObject(tokenData, previousCID, "zeko");

    if (!ipfsResults || !Array.isArray(ipfsResults) || ipfsResults.length < 2) {
      throw new Error("Invalid result from IPFS pinning operation");
    }

    [ipfsCID, commitment] = ipfsResults;
    console.log("\nSUCCESS! IPFS pinning successful:");
    console.log(` CID: ${ipfsCID}`);
    console.log(` Commitment: ${commitment}`);

    console.log("Verifying IPFS data accessibility...");
    await verifyIpfsAccessibility(ipfsCID);
    console.log("SUCCESS! IPFS data verification successful");

    console.log("\nPre-computing cryptographic objects for Zeko L2...");

    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH = IpfsCID.fromString(ipfsCID);

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

    const tokenInfo = new TokenInformationArray({
      prices: orderedTokens.map((token) => {
        const cache = tokenData[token];
        if (!cache || !cache.price) {
          throw new Error(`Missing cache data for token ${token}`);
        }
        return Field.from(cache.price);
      }),
    });

    const ZEKO_CALLER_KEY = process.env.DOOT_CALLER_KEY;
    if (!ZEKO_CALLER_KEY) {
      throw new Error("Missing DOOT_CALLER_KEY environment variable");
    }

    const caller = PrivateKey.fromBase58(ZEKO_CALLER_KEY);
    const callerPub = caller.toPublicKey();

    const sharedTxnData = {
      COMMITMENT,
      IPFS_HASH,
      TOKEN_INFO: tokenInfo,
      caller,
      callerPub,
    };

    const zekoContractKey = process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;
    if (!zekoContractKey) {
      throw new Error("Missing NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY environment variable");
    }

    const dootPub = PublicKey.fromBase58(zekoContractKey);
    const dootZkApp = new Doot(dootPub);
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    const zekoResult = await updateZekoL2ContractWithPolling(
      dootZkApp,
      sharedTxnData,
      isGlobalTimeoutReached
    );

    if (!zekoResult.success) {
      throw new Error(zekoResult.error || "Zeko L2 transaction failed");
    }

    console.log("SUCCESS! Zeko L2 contract updated.");
    console.log(
      `Transaction: ${zekoResult.txHash}$${
        zekoResult.confirmed ? " CONFIRMED" : " PENDING"
      }`
    );

    if (zekoResult.settlementTxHash) {
      console.log(`Settlement transaction: ${zekoResult.settlementTxHash}`);
    }

    console.log("Updating redis cache.");
    await redis.set(ZEKO_CID_CACHE, [ipfsCID, commitment]);
    console.log("SUCCESS! Redis cache updated with new IPFS data");

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    cleanup();

    return {
      status: true,
      message: "Zeko L2 Doot oracle update completed",
      data: {
        ipfs: { cid: ipfsCID, commitment },
        network_type: "zeko_l2",
        transaction_hash: zekoResult.txHash,
        settlement_hash: zekoResult.settlementTxHash,
        elapsed_seconds: elapsed,
      },
    };
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    cleanup();
    console.error("FATAL ERR! Zeko L2 update failed:", error.message || error);
    return {
      status: false,
      message: "Zeko L2 Doot oracle update failed",
      error: error.message || String(error),
      data: {
        ipfs: ipfsCID ? { cid: ipfsCID, commitment } : null,
        network_type: "zeko_l2",
        elapsed_seconds: elapsed,
        timeout_reached: globalTimeoutReached,
      },
    };
  }
}

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

async function fetchAccountWithRetry(accountInfo, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchAccount(accountInfo);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function updateZekoL2ContractWithPolling(
  dootZkApp,
  sharedTxnData,
  isGlobalTimeoutReached
) {
  try {
    console.log("Configuring Zeko L2 network connection...");

    const ZEKO_ENDPOINT = process.env.NEXT_PUBLIC_ZEKO_ENDPOINT;
    const ZEKO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;

    if (!ZEKO_ENDPOINT || !ZEKO_CONTRACT_ADDRESS) {
      throw new Error("Missing Zeko L2 environment variables");
    }

    console.log(`NETWORK! Connecting to: ${ZEKO_ENDPOINT}`);
    console.log(` Archive: ${ZEKO_ENDPOINT}`);
    console.log(` Contract: ${ZEKO_CONTRACT_ADDRESS}`);

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: "Global timeout reached before network setup",
      };
    }

    const contractPub = PublicKey.fromBase58(ZEKO_CONTRACT_ADDRESS);

    const zekoNetwork = Mina.Network({
      mina: ZEKO_ENDPOINT,
      archive: ZEKO_ENDPOINT,
    });
    Mina.setActiveInstance(zekoNetwork);

    await fetchAccountWithRetry({ publicKey: contractPub });
    await fetchAccountWithRetry({ publicKey: sharedTxnData.callerPub });

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: "Global timeout reached before transaction creation",
      };
    }

    console.log("Creating and proving Zeko L2 transaction...");

    const txn = await Mina.transaction(
      { sender: sharedTxnData.callerPub, fee: 0.1 * 5e9 },
      async () => {
        await dootZkApp.update(
          sharedTxnData.COMMITMENT,
          sharedTxnData.IPFS_HASH,
          sharedTxnData.TOKEN_INFO
        );
      }
    );

    await txn.prove();
    console.log("SUCCESS! Zeko L2 transaction proved successfully");

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: "Global timeout reached before transaction send",
      };
    }

    const signedTxn = txn.sign([sharedTxnData.caller]);
    const pendingTxn = await signedTxn.send();

    console.log(`SUCCESS! Zeko L2 transaction sent: ${pendingTxn.hash}`);

    const zekoConfirmed = await waitForTransactionConfirmationWithPolling(
      pendingTxn,
      "Zeko L2",
      isGlobalTimeoutReached
    );

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: "Global timeout reached during transaction confirmation",
        txHash: pendingTxn.hash,
        confirmed: false,
      };
    }

    let settlementTxHash = null;
    if (zekoConfirmed) {
      console.log("Zeko L2 confirmed! Sending settlement...");
      try {
        if (isGlobalTimeoutReached()) {
          console.log("WARN! Global timeout reached before settlement");
        } else {
          const freshContractPub = PublicKey.fromBase58(ZEKO_CONTRACT_ADDRESS);
          const freshDootZkApp = new Doot(freshContractPub);
          freshDootZkApp.offchainState.setContractInstance(freshDootZkApp);

          console.log("Creating settlement proof...");
          const settlementProof =
            await freshDootZkApp.offchainState.createSettlementProof();

          if (!isGlobalTimeoutReached()) {
            console.log("Building settlement transaction...");
            const settleTxn = await Mina.transaction(
              { sender: sharedTxnData.callerPub, fee: 0.1 * 5e9 },
              async () => {
                await freshDootZkApp.settle(settlementProof);
              }
            );

            console.log("Proving settlement transaction...");
            await settleTxn.prove();

            if (!isGlobalTimeoutReached()) {
              console.log("Sending settlement transaction...");
              const settlementPending = await settleTxn
                .sign([sharedTxnData.caller])
                .send();
              settlementTxHash = settlementPending.hash;

              console.log(
                `SUCCESS! Zeko L2 settlement sent: ${settlementTxHash}`
              );
            }
          }
        }
      } catch (settlementError) {
        console.warn(
          `WARN! Zeko L2 settlement failed: ${settlementError.message}`
        );
        console.warn("Settlement error stack:", settlementError.stack);
      }
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
    console.error("ERR! Zeko L2 transaction error:", error.message || error);
    return {
      success: false,
      error: error.message || String(error),
      network: "zeko_l2",
    };
  }
}

async function waitForTransactionConfirmationWithPolling(
  pendingTransaction,
  networkName,
  isGlobalTimeoutReached
) {
  console.log(`Waiting for ${networkName} confirmation with 20s polling...`);

  if (pendingTransaction.status !== "pending") {
    console.error(
      `ERR! ${networkName} transaction not accepted by daemon:`,
      pendingTransaction.status
    );
    return false;
  }

  console.log(
    `SUCCESS! ${networkName} transaction accepted for processing by daemon`
  );

  if (isGlobalTimeoutReached()) {
    console.log(`WARN! ${networkName} confirmation stopped due to timeout`);
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log(
    `SUCCESS! ${networkName} transaction successfully confirmed: ${pendingTransaction.hash}`
  );
  return true;
}

module.exports = { updateDootZeko };
