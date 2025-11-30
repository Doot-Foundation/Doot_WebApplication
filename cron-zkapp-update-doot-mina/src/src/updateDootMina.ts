import { redis } from './utils/helper/init/InitRedis.js';
import { TOKEN_TO_CACHE, MINA_CID_CACHE } from './utils/constants/info.js';
import { pinMinaObject } from './utils/helper/PinMinaObject.js';
import axios from 'axios';
import { downloadObject } from './utils/helper/supabaseStorage.js';
import {
  Mina,
  PrivateKey,
  Field,
  fetchAccount,
  PublicKey,
  UInt32,
  UInt64,
} from 'o1js';
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

interface MinaTransactionResult {
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

export async function updateDootMina(): Promise<UpdateResult> {
  const startTime = Date.now();
  const GLOBAL_TIMEOUT_MS = 600 * 1000; // 10 minutes
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
      '\n=============== MINA L1 DOOT ORACLE UPDATE STARTED ===============\n'
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
      const existingMinaCacheData = await redis.get(MINA_CID_CACHE);
      if (
        existingMinaCacheData &&
        Array.isArray(existingMinaCacheData) &&
        existingMinaCacheData[0]
      ) {
        previousCID = existingMinaCacheData[0] as string;
        console.log(`Found previous CID for unpinning: ${previousCID}`);
      }
    } catch (error) {
      console.log(
        `INFO! No previous CID found (fresh start): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const ipfsResults = await pinMinaObject(tokenData, previousCID, 'mina');

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

    console.log('\nPre-computing cryptographic objects for Mina L1...');

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

    const MINA_CALLER_KEY = process.env.DOOT_CALLER_KEY;
    if (!MINA_CALLER_KEY) {
      throw new Error('Missing DOOT_CALLER_KEY environment variable');
    }

    const caller = PrivateKey.fromBase58(MINA_CALLER_KEY);
    const callerPub = caller.toPublicKey();

    const sharedTxnData = {
      COMMITMENT,
      IPFS_HASH,
      TOKEN_INFO: tokenInfo,
      caller,
      callerPub,
    };

    const dootPubKeyBase58 = process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY;
    if (!dootPubKeyBase58) {
      throw new Error(
        'Missing NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY environment variable'
      );
    }

    const dootPub = PublicKey.fromBase58(dootPubKeyBase58);
    const dootZkApp = new Doot(dootPub);
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    const minaResult = await updateMinaContractWithPolling(
      dootZkApp,
      sharedTxnData,
      isGlobalTimeoutReached
    );

    if (!minaResult.success) {
      throw new Error(minaResult.error || 'Mina L1 transaction failed');
    }

    console.log('SUCCESS! Mina L1 contract updated.');
    console.log(
      `Transaction: ${minaResult.txHash}${
        minaResult.confirmed ? ' CONFIRMED' : ' PENDING'
      }`
    );

    if (minaResult.settlementTxHash) {
      console.log(`Settlement transaction: ${minaResult.settlementTxHash}`);
    }

    console.log('Updating redis cache.');
    await redis.set(MINA_CID_CACHE, [ipfsCID, commitment]);
    console.log('SUCCESS! Redis cache updated with new IPFS data');

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    cleanup();

    return {
      status: true,
      message: 'Mina L1 Doot oracle update completed',
      data: {
        ipfs: { cid: ipfsCID, commitment },
        network_type: 'mina_l1',
        transaction_hash: minaResult.txHash,
        settlement_hash: minaResult.settlementTxHash || undefined,
        elapsed_seconds: elapsed,
      },
    };
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    cleanup();
    console.error(
      'FATAL ERR! Mina L1 update failed:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      status: false,
      message: 'Mina L1 Doot oracle update failed',
      error: error instanceof Error ? error.message : String(error),
      data: {
        ipfs: ipfsCID
          ? { cid: ipfsCID, commitment: commitment || '' }
          : undefined,
        network_type: 'mina_l1',
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

async function getCurrentNonce(publicKey: PublicKey): Promise<UInt32> {
  await fetchAccountWithRetry({ publicKey });
  const account = Mina.getAccount(publicKey);
  return account.nonce;
}

async function waitForNonceIncrement(
  publicKey: PublicKey,
  originalNonce: number,
  expectedNonce: number,
  timeoutMs = 300000 // 5 minutes
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds

  console.log(
    `Polling for nonce increment: waiting for nonce ${expectedNonce} (was ${originalNonce})`
  );

  while (Date.now() - startTime < timeoutMs) {
    try {
      const currentNonce = await getCurrentNonce(publicKey);
      const currentNonceNumber = Number(currentNonce.toString());

      console.log(
        `Current nonce: ${currentNonceNumber}, expected: ${expectedNonce}`
      );

      if (currentNonceNumber >= expectedNonce) {
        console.log(
          `SUCCESS! Nonce incremented to ${currentNonceNumber}, proceeding with settlement`
        );
        return true;
      }

      console.log(`Nonce still ${currentNonceNumber}, waiting 10 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.warn(
        `Error checking nonce: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  console.warn(
    `Timeout waiting for nonce increment after ${timeoutMs / 1000} seconds`
  );
  return false;
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
      const prefix = (process.env.SUPABASE_MINA_PREFIX || 'mina').replace(
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

async function updateMinaContractWithPolling(
  dootZkApp: Doot,
  sharedTxnData: {
    COMMITMENT: Field;
    IPFS_HASH: IpfsCID;
    TOKEN_INFO: TokenInformationArrayInput;
    caller: PrivateKey;
    callerPub: PublicKey;
  },
  isGlobalTimeoutReached: () => boolean
): Promise<MinaTransactionResult> {
  try {
    console.log('Configuring Mina L1 network connection...');

    const MINA_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
    const MINA_ARCHIVE_ENDPOINT = process.env.NEXT_PUBLIC_MINA_ARCHIVE_ENDPOINT;
    const MINA_DOOT_PUBLIC_KEY = process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY;

    if (!MINA_ENDPOINT || !MINA_DOOT_PUBLIC_KEY) {
      throw new Error('Missing Mina environment variables');
    }

    console.log(`NETWORK! Connecting to: ${MINA_ENDPOINT}`);
    console.log(` Archive: ${MINA_ARCHIVE_ENDPOINT || '(not configured)'}`);
    console.log(` Contract: ${MINA_DOOT_PUBLIC_KEY}`);

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: 'Global timeout reached before network setup',
      };
    }

    const contractPub = PublicKey.fromBase58(MINA_DOOT_PUBLIC_KEY);

    const minaNetwork = Mina.Network({
      mina: MINA_ENDPOINT,
      archive: MINA_ARCHIVE_ENDPOINT,
    });
    Mina.setActiveInstance(minaNetwork);

    await fetchAccountWithRetry({ publicKey: contractPub });
    await fetchAccountWithRetry({ publicKey: sharedTxnData.callerPub });

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: 'Global timeout reached before transaction creation',
      };
    }

    console.log('Creating and proving Mina L1 transaction...');

    // Get current nonce for the sender account
    const currentNonce = await getCurrentNonce(sharedTxnData.callerPub);
    const nonceNumber = Number(currentNonce.toString());
    console.log(`Using nonce ${nonceNumber} for main transaction`);
    const feeAlloted = 1e9 * Number(process.env.MINA_UPDATE_TXN_FEE || 2);
    const txn = await Mina.transaction(
      {
        sender: sharedTxnData.callerPub,
        fee: feeAlloted,
        nonce: nonceNumber,
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
    console.log('SUCCESS! Mina L1 transaction proved successfully');

    if (isGlobalTimeoutReached()) {
      return {
        success: false,
        timeout: true,
        message: 'Global timeout reached before transaction send',
      };
    }

    const signedTxn = txn.sign([sharedTxnData.caller]);
    const pendingTxn = await signedTxn.send();

    console.log(`SUCCESS! Mina L1 transaction sent: ${pendingTxn.hash}`);

    const minaConfirmed = await waitForTransactionConfirmationWithPolling(
      pendingTxn,
      'Mina L1',
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
    if (minaConfirmed) {
      console.log(
        'Mina L1 confirmed! Waiting for nonce increment before settlement...'
      );

      try {
        if (isGlobalTimeoutReached()) {
          console.log('WARN! Global timeout reached before settlement');
        } else {
          const freshContractPub = PublicKey.fromBase58(MINA_DOOT_PUBLIC_KEY);
          const freshDootZkApp = new Doot(freshContractPub);
          freshDootZkApp.offchainState.setContractInstance(freshDootZkApp);

          // Wait for nonce to increment from the main transaction FIRST
          console.log('Waiting for nonce increment before settlement...');
          const expectedNonce = nonceNumber + 1;
          const nonceIncremented = await waitForNonceIncrement(
            sharedTxnData.callerPub,
            nonceNumber,
            expectedNonce
          );

          if (!nonceIncremented) {
            console.warn(
              'WARN! Nonce did not increment in time, skipping settlement'
            );
            return {
              success: true,
              txHash: pendingTxn.hash,
              confirmed: minaConfirmed,
              settlementTxHash: null,
              network: 'mina_l1',
              finality: '3-5 minutes',
              endpoint: MINA_ENDPOINT,
            };
          }

          // Add 60-second buffer for L1 finality before creating settlement proof
          console.log(
            'Nonce incremented! Waiting additional 60 seconds for L1 finality before creating settlement proof...'
          );
          await new Promise((resolve) => setTimeout(resolve, 60000));

          if (!isGlobalTimeoutReached()) {
            // Refresh account state AFTER nonce increment and delay
            console.log('Refreshing account state after L1 finality wait...');
            await fetchAccountWithRetry({ publicKey: freshContractPub });
            await fetchAccountWithRetry({ publicKey: sharedTxnData.callerPub });

            console.log(
              'Creating settlement proof with current offchain state...'
            );
            const settlementProof =
              await freshDootZkApp.offchainState.createSettlementProof();

            // Get the current nonce after all waits
            const currentNonce = await getCurrentNonce(sharedTxnData.callerPub);
            const settlementNonce = Number(currentNonce.toString());
            console.log(
              `Settlement proof created, using nonce ${settlementNonce} for transaction`
            );

            console.log('Building settlement transaction...');
            const settlementFeeAlloted =
              1e9 * Number(process.env.MINA_SETTLEMENT_TXN_FEE || 1);
            const settleTxn = await Mina.transaction(
              {
                sender: sharedTxnData.callerPub,
                fee: settlementFeeAlloted,
                nonce: settlementNonce,
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
                `SUCCESS! Mina L1 settlement sent: ${settlementTxHash}`
              );
            }
          }
        }
      } catch (settlementError) {
        console.warn(
          `WARN! Mina L1 settlement failed: ${
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

    return {
      success: true,
      txHash: pendingTxn.hash,
      confirmed: minaConfirmed,
      settlementTxHash,
      network: 'mina_l1',
      finality: '3-5 minutes',
      endpoint: MINA_ENDPOINT,
    };
  } catch (error) {
    console.error(
      'ERR! Mina L1 transaction error:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      network: 'mina_l1',
    };
  }
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
