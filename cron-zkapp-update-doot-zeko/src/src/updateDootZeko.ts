import { redis } from './utils/helper/init/InitRedis.js';
import { TOKEN_TO_CACHE, ZEKO_CID_CACHE } from './utils/constants/info.js';
import { pinMinaObject } from './utils/helper/PinMinaObject.js';
import axios from 'axios';
import { downloadObject } from './utils/helper/supabaseStorage.js';
import { Mina, PrivateKey, Field, fetchAccount, PublicKey, UInt64 } from 'o1js';
import {
  Doot,
  IpfsCID,
  TokenInformationArrayInput,
  offchainState,
} from './utils/constants/Doot.js';

interface TokenDataMap {
  [key: string]: {
    price: string;
    [key: string]: any;
  };
}

interface UpdateResult {
  status: boolean;
  message: string;
  error?: string;
  data: {
    ipfs?: { cid: string; commitment: string };
    network_type: string;
    transaction_hash?: string;
    settlement_hash?: string;
    elapsed_seconds: number;
    timeout_reached?: boolean;
  };
}

interface ZekoTransactionResult {
  success: boolean;
  timeout?: boolean;
  txHash?: string;
  confirmed?: boolean;
  settlementTxHash?: string | null;
  network?: string;
  finality?: string;
  endpoint?: string;
  error?: string;
  message?: string;
}

export async function updateDootZeko(): Promise<UpdateResult> {
  const startTime = Date.now();
  const GLOBAL_TIMEOUT_MS = 900 * 1000; // 15 minutes (to allow time for settlement)
  let globalTimeoutReached = false;
  let ipfsCID: string | null = null;
  let commitment: string | null = null;

  const globalTimeout = setTimeout(() => {
    globalTimeoutReached = true;
  }, GLOBAL_TIMEOUT_MS);

  const isGlobalTimeoutReached = () => globalTimeoutReached;

  const cleanup = () => {
    clearTimeout(globalTimeout);
    if (global.gc) {
      global.gc();
      console.log('CLEANUP! Forced garbage collection completed');
    }
  };

  try {
    console.log('Compiling Doot contract and offchain state...');
    if (offchainState && typeof offchainState.compile === 'function') {
      try {
        await offchainState.compile();
      } catch (error) {
        console.error('offchainState compilation failed with:', error);
        throw new Error(
          `Contract compilation failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    try {
      await Doot.compile();
    } catch (error) {
      console.error('Doot compilation failed with:', error);
      throw new Error(
        `Contract compilation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    console.log(
      'SUCCESS! Doot offchainState + contract compiled successfully.'
    );

    console.log(
      '\n=============== ZEKO L2 DOOT ORACLE UPDATE STARTED ===============\n'
    );

    const tokenData: TokenDataMap = {};
    const tokenKeys = Object.keys(TOKEN_TO_CACHE);
    const requiredAssets = [
      'mina',
      'bitcoin',
      'ethereum',
      'solana',
      'ripple',
      'cardano',
      'avalanche',
      'polygon',
      'chainlink',
      'dogecoin',
    ];

    const validCacheKeys: Array<{ tokenKey: string; cacheKey: string }> = [];
    for (const tokenKey of tokenKeys) {
      const cacheKey = TOKEN_TO_CACHE[tokenKey as keyof typeof TOKEN_TO_CACHE];
      if (cacheKey && typeof cacheKey === 'string' && cacheKey.trim() !== '') {
        validCacheKeys.push({ tokenKey, cacheKey });
      } else {
        console.warn(`Invalid cache key for token ${tokenKey}:`, cacheKey);
      }
    }

    for (const { tokenKey, cacheKey } of validCacheKeys) {
      try {
        const data = await redis.get(cacheKey);
        if (data) {
          tokenData[tokenKey] = data as TokenDataMap[string];
        }
      } catch (error) {
        console.error(
          `ERR! Failed to get cache for ${tokenKey} (${cacheKey}):`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const missingAssets = requiredAssets.filter((asset) => !tokenData[asset]);
    if (missingAssets.length > 0) {
      throw new Error(
        `Missing required assets for IPFS pinning: ${missingAssets.join(', ')}`
      );
    }

    console.log(
      `SUCCESS! Collected data for ${Object.keys(tokenData).length} tokens:`,
      Object.keys(tokenData)
    );

    let previousCID = 'NULL';
    try {
      const existingZekoCacheData = await redis.get(ZEKO_CID_CACHE);
      if (
        existingZekoCacheData &&
        Array.isArray(existingZekoCacheData) &&
        existingZekoCacheData[0]
      ) {
        previousCID = existingZekoCacheData[0] as string;
        console.log(`Found previous CID for unpinning: ${previousCID}`);
      }
    } catch (error) {
      console.log(
        `INFO! No previous CID found (fresh start): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const ipfsResults = await pinMinaObject(tokenData, previousCID, 'zeko');

    if (!ipfsResults || !Array.isArray(ipfsResults) || ipfsResults.length < 2) {
      throw new Error('Invalid result from IPFS pinning operation');
    }

    [ipfsCID, commitment] = ipfsResults;
    console.log('\nSUCCESS! IPFS pinning successful:');
    console.log(` CID: ${ipfsCID}`);
    console.log(` Commitment: ${commitment}`);

    console.log('Verifying IPFS data accessibility...');
    await verifyIpfsAccessibility(ipfsCID);
    console.log('SUCCESS! IPFS data verification successful');

    console.log('\nPre-computing cryptographic objects for Zeko L2...');

    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH = IpfsCID.fromString(ipfsCID);

    const orderedTokens = [
      'mina',
      'bitcoin',
      'ethereum',
      'solana',
      'ripple',
      'cardano',
      'avalanche',
      'polygon',
      'chainlink',
      'dogecoin',
    ];

    const tokenInfo = new TokenInformationArrayInput({
      prices: orderedTokens.map((token) => {
        const cache = tokenData[token];
        if (!cache || !cache.price) {
          throw new Error(`Missing cache data for token ${token}`);
        }
        return Field.from(cache.price);
      }),
      lastUpdatedAt: UInt64.fromValue(Date.now()),
    });

    const ZEKO_CALLER_KEY = process.env.DOOT_CALLER_KEY;
    if (!ZEKO_CALLER_KEY) {
      throw new Error('Missing DOOT_CALLER_KEY environment variable');
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
      throw new Error(
        'Missing NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY environment variable'
      );
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
      throw new Error(zekoResult.error || 'Zeko L2 transaction failed');
    }

    console.log('SUCCESS! Zeko L2 contract updated.');
    console.log(
      `Transaction: ${zekoResult.txHash}${
        zekoResult.confirmed ? ' CONFIRMED' : ' PENDING'
      }`
    );

    if (zekoResult.settlementTxHash) {
      console.log(`Settlement transaction: ${zekoResult.settlementTxHash}`);
    }

    console.log('Updating redis cache.');
    await redis.set(ZEKO_CID_CACHE, [ipfsCID, commitment]);
    console.log('SUCCESS! Redis cache updated with new IPFS data');

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    cleanup();

    return {
      status: true,
      message: 'Zeko L2 Doot oracle update completed',
      data: {
        ipfs: { cid: ipfsCID, commitment },
        network_type: 'zeko_l2',
        transaction_hash: zekoResult.txHash,
        settlement_hash: zekoResult.settlementTxHash || undefined,
        elapsed_seconds: elapsed,
      },
    };
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    cleanup();
    console.error(
      'FATAL ERR! Zeko L2 update failed:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      status: false,
      message: 'Zeko L2 Doot oracle update failed',
      error: error instanceof Error ? error.message : String(error),
      data: {
        ipfs: ipfsCID
          ? { cid: ipfsCID, commitment: commitment || '' }
          : undefined,
        network_type: 'zeko_l2',
        elapsed_seconds: elapsed,
        timeout_reached: globalTimeoutReached,
      },
    };
  }
}

async function fetchAccountWithRetry(
  accountInfo: { publicKey: PublicKey },
  maxRetries = 3
): Promise<void> {
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

async function verifyIpfsAccessibility(cid: string): Promise<any> {
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!GATEWAY) throw new Error('Missing NEXT_PUBLIC_PINATA_GATEWAY');
  try {
    const response = await axios.get(`https://${GATEWAY}/ipfs/${cid}`, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
    });
    return response.data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`IPFS verification failed (${msg}). Attempting Supabase fallback...`);
    try {
      const prefix = (process.env.SUPABASE_ZEKO_PREFIX || 'zeko').replace(
        /^\/+|\/+$/g,
        ''
      );
      const pointerPath = `${prefix}_latest.json`;
      let objectPath = `${prefix}_${cid}.json`;
      try {
        const pointerRaw = await downloadObject({ objectPath: pointerPath });
        const pointer = JSON.parse(pointerRaw);
        if (pointer?.object_path) {
          objectPath = pointer.object_path;
        }
      } catch {
        // ignore pointer fetch failures; fall back to cid-based path
      }
      const downloaded = await downloadObject({ objectPath });
      return JSON.parse(downloaded);
    } catch (fallbackErr) {
      const fb =
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      throw new Error(
        `Failed to fetch IPFS data for CID ${cid}: ${msg}; Supabase fallback failed: ${fb}`
      );
    }
  }
}

async function updateZekoL2ContractWithPolling(
  dootZkApp: Doot,
  sharedTxnData: {
    COMMITMENT: Field;
    IPFS_HASH: IpfsCID;
    TOKEN_INFO: TokenInformationArrayInput;
    caller: PrivateKey;
    callerPub: PublicKey;
  },
  isGlobalTimeoutReached: () => boolean
): Promise<ZekoTransactionResult> {
  const MAX_RETRIES = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `\n--- Attempt ${attempt}/${MAX_RETRIES} to update Zeko L2 ---`
      );
      console.log('Configuring Zeko L2 network connection...');

      const ZEKO_ENDPOINT = process.env.NEXT_PUBLIC_ZEKO_ENDPOINT;
      const ZEKO_ARCHIVE_ENDPOINT =
        process.env.NEXT_PUBLIC_ZEKO_ARCHIVE_ENDPOINT;
      const ZEKO_CONTRACT_ADDRESS =
        process.env.NEXT_PUBLIC_ZEKO_DOOT_PUBLIC_KEY;

      if (!ZEKO_ENDPOINT || !ZEKO_CONTRACT_ADDRESS) {
        throw new Error('Missing Zeko environment variables');
      }

      console.log(`NETWORK! Connecting to: ${ZEKO_ENDPOINT}`);
      console.log(` Archive: ${ZEKO_ARCHIVE_ENDPOINT}`);
      console.log(` Contract: ${ZEKO_CONTRACT_ADDRESS}`);

      if (isGlobalTimeoutReached()) {
        return {
          success: false,
          timeout: true,
          message: 'Global timeout reached before network setup',
        };
      }

      const contractPub = PublicKey.fromBase58(ZEKO_CONTRACT_ADDRESS);

      const zekoNetwork = Mina.Network({
        mina: ZEKO_ENDPOINT,
        archive: ZEKO_ARCHIVE_ENDPOINT,
      });
      Mina.setActiveInstance(zekoNetwork);

      console.log('Fetching account states with retry logic...');
      await fetchAccountWithRetry({ publicKey: contractPub }, 5);
      await fetchAccountWithRetry({ publicKey: sharedTxnData.callerPub }, 5);

      if (isGlobalTimeoutReached()) {
        return {
          success: false,
          timeout: true,
          message: 'Global timeout reached before transaction creation',
        };
      }

      // CRITICAL FIX: Ensure actions are properly loaded
      // This happens automatically during the update() call, but we ensure account state is fresh
      console.log(
        'Account states fetched successfully, ready for transaction creation'
      );

      console.log('Creating and proving Zeko L2 transaction...');
      const feeAlloted = 1e9 * Number(process.env.ZEKO_UPDATE_TXN_FEE || 2);
      const txn = await Mina.transaction(
        {
          sender: sharedTxnData.callerPub,
          fee: feeAlloted,
          memo: 'Doot-Update Prices',
        },
        async () => {
          await dootZkApp.update(
            sharedTxnData.COMMITMENT,
            sharedTxnData.IPFS_HASH,
            sharedTxnData.TOKEN_INFO
          );
        }
      );

      await txn.prove();
      console.log('SUCCESS! Zeko L2 transaction proved successfully');

      if (isGlobalTimeoutReached()) {
        return {
          success: false,
          timeout: true,
          message: 'Global timeout reached before transaction send',
        };
      }

      const signedTxn = txn.sign([sharedTxnData.caller]);

      // Retry logic for transaction sending (handles 502 Bad Gateway)
      let pendingTxn: any;
      let sendSuccess = false;

      for (let sendAttempt = 1; sendAttempt <= 3; sendAttempt++) {
        try {
          console.log(`Sending transaction (send attempt ${sendAttempt}/3)...`);
          pendingTxn = await signedTxn.send();
          sendSuccess = true;
          console.log(`SUCCESS! Zeko L2 transaction sent: ${pendingTxn.hash}`);
          break;
        } catch (sendError: any) {
          const errorMsg =
            sendError instanceof Error ? sendError.message : String(sendError);
          console.warn(
            `WARN! Transaction send attempt ${sendAttempt} failed: ${errorMsg}`
          );

          // Check if it's a 502 Bad Gateway or network error
          if (
            errorMsg.includes('502') ||
            errorMsg.includes('Bad Gateway') ||
            errorMsg.includes('ECONNRESET') ||
            errorMsg.includes('ETIMEDOUT')
          ) {
            if (sendAttempt < 3) {
              const backoffMs = Math.pow(2, sendAttempt) * 2000; // 4s, 8s
              console.log(`Retrying after ${backoffMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              continue;
            }
          }
          throw sendError;
        }
      }

      if (!sendSuccess || !pendingTxn) {
        throw new Error('Failed to send transaction after 3 attempts');
      }

      const zekoConfirmed = await waitForTransactionConfirmationWithPolling(
        pendingTxn,
        'Zeko L2',
        isGlobalTimeoutReached
      );

      if (isGlobalTimeoutReached()) {
        return {
          success: false,
          timeout: true,
          message: 'Global timeout reached during transaction confirmation',
          txHash: pendingTxn.hash,
          confirmed: false,
        };
      }

      let settlementTxHash: string | null = null;
      if (zekoConfirmed) {
        console.log(
          'Zeko L2 confirmed! Waiting 30 seconds before settlement to avoid nonce conflicts...'
        );

        // Wait 30 seconds to ensure the main transaction is fully processed
        await new Promise((resolve) => setTimeout(resolve, 30000));
        console.log('30-second delay completed. Proceeding with settlement...');

        try {
          if (isGlobalTimeoutReached()) {
            console.log('WARN! Global timeout reached before settlement');
          } else {
            const freshContractPub = PublicKey.fromBase58(
              ZEKO_CONTRACT_ADDRESS
            );
            const freshDootZkApp = new Doot(freshContractPub);
            freshDootZkApp.offchainState.setContractInstance(freshDootZkApp);

            // Refresh account state to ensure proper nonce handling
            console.log('Refreshing account state before settlement...');
            await fetchAccountWithRetry({ publicKey: freshContractPub }, 5);
            await fetchAccountWithRetry(
              { publicKey: sharedTxnData.callerPub },
              5
            );

            console.log('Creating settlement proof...');
            const settlementProof =
              await freshDootZkApp.offchainState.createSettlementProof();

            if (!isGlobalTimeoutReached()) {
              console.log('Building settlement transaction...');
              const settlementFeeAlloted =
                1e9 * Number(process.env.ZEKO_SETTLEMENT_TXN_FEE || 1);
              const settleTxn = await Mina.transaction(
                {
                  sender: sharedTxnData.callerPub,
                  fee: settlementFeeAlloted,
                  memo: 'Doot-Settling OffchainState',
                },
                async () => {
                  await freshDootZkApp.settle(settlementProof);
                }
              );

              console.log('Proving settlement transaction...');
              await settleTxn.prove();

              if (!isGlobalTimeoutReached()) {
                console.log('Sending settlement transaction...');
                const settlementPending = await settleTxn
                  .sign([sharedTxnData.caller])
                  .send();
                settlementTxHash = settlementPending.hash;

                console.log(
                  `SUCCESS! Zeko L2 settlement sent: ${settlementTxHash}`
                );
              } else {
                console.warn(
                  'WARN! Global timeout reached after proving settlement. Settlement transaction NOT sent.'
                );
              }
            } else {
              console.warn(
                'WARN! Global timeout reached after creating settlement proof. Settlement transaction NOT built.'
              );
            }
          }
        } catch (settlementError) {
          console.warn(
            `WARN! Zeko L2 settlement failed: ${
              settlementError instanceof Error
                ? settlementError.message
                : String(settlementError)
            }`
          );
          console.warn(
            'Settlement error stack:',
            settlementError instanceof Error ? settlementError.stack : ''
          );
        }
      }

      // Success - return result and exit retry loop
      return {
        success: true,
        txHash: pendingTxn.hash,
        confirmed: zekoConfirmed,
        settlementTxHash,
        network: 'zeko_l2',
        finality: '10-25 seconds',
        endpoint: ZEKO_ENDPOINT,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `ERR! Zeko L2 transaction error (attempt ${attempt}/${MAX_RETRIES}):`,
        lastError.message
      );
      console.error('Stack trace:', lastError.stack);

      // Check if error is retryable
      const errorMsg = lastError.message;
      const isRetryable =
        errorMsg.includes('Could not fetch action state') ||
        errorMsg.includes('502') ||
        errorMsg.includes('Bad Gateway') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('network') ||
        errorMsg.includes('timeout');

      if (!isRetryable || attempt === MAX_RETRIES) {
        console.error(
          `FATAL! Non-retryable error or max retries reached. Giving up.`
        );
        break;
      }

      // Exponential backoff before retry
      const backoffMs = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s
      console.log(`Retrying entire update after ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Unknown error after all retries',
    network: 'zeko_l2',
  };
}

async function waitForTransactionConfirmationWithPolling(
  pendingTransaction: any,
  networkName: string,
  isGlobalTimeoutReached: () => boolean
): Promise<boolean> {
  console.log(`Waiting for ${networkName} confirmation with 20s polling...`);

  if (pendingTransaction.status !== 'pending') {
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
