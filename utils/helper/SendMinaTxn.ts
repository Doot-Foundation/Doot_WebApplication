import { Mina, PrivateKey, Field, fetchAccount, PublicKey } from "o1js";
import {
  Doot,
  IpfsCID,
  TokenInformationArray,
} from "@/utils/constants/Doot.js";
import { FileSystem, fetchDootFiles } from "@/utils/helper/LoadCache";
import { setTimeout } from "timers/promises";

const DOOT_CALLER_KEY = process.env.DOOT_CALLER_KEY;
const DOOT_KEY = process.env.DOOT_KEY;
const ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

type AccountInfo = {
  publicKey: PublicKey;
};

async function fetchAccountWithRetry(
  accountInfo: AccountInfo,
  maxRetries = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchAccount(accountInfo);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await setTimeout(1000 * (i + 1)); // Exponential backoff
    }
  }
}

async function sendMinaTxn(
  commitment: string,
  ipfs: string,
  prices: bigint[]
): Promise<boolean | undefined> {
  if (!DOOT_CALLER_KEY || !DOOT_KEY || !ENDPOINT) {
    console.error("Missing required environment variables");
    return undefined;
  }

  try {
    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(ipfs);
    const PRICES: TokenInformationArray = new TokenInformationArray({
      prices: prices.map((e) => Field.from(e)),
    });

    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const dootPub = doot.toPublicKey();
    const deployer = PrivateKey.fromBase58(DOOT_CALLER_KEY);
    const deployerPub = deployer.toPublicKey();

    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);

    const dootAccountInfo = { publicKey: dootPub };
    const deployerAccountInfo = { publicKey: deployerPub };

    // Fetch accounts in parallel with retry logic
    await Promise.all([
      fetchAccountWithRetry(dootAccountInfo),
      fetchAccountWithRetry(deployerAccountInfo),
    ]);

    // Compile and prepare transaction
    const cacheFiles = await fetchDootFiles();
    await Doot.compile({ cache: FileSystem(cacheFiles) });
    const dootZkApp = new Doot(dootPub);

    console.log("Proving and sending txn...");

    // Create and prove transaction
    const txn = await Mina.transaction(deployerPub, async () => {
      await dootZkApp.update(COMMITMENT, IPFS_HASH, PRICES);
    }).prove();

    console.log("Proved.");

    // Sign and send transaction
    const res = await txn.sign([deployer]).send();
    console.log("Sent txn:", res.hash);

    return true;
  } catch (error) {
    console.error(
      "Transaction failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error; // Re-throw to handle at caller level if needed
  }
}

export default sendMinaTxn;
