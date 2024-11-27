import { Mina, PrivateKey, PublicKey, fetchAccount } from "o1js";
import { Doot, offchainState } from "@/utils/constants/Doot.js";
import { setTimeout } from "timers/promises";

const DOOT_KEY = process.env.DOOT_KEY;
const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
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
      await setTimeout(1000 * (i + 1));
    }
  }
}

async function sendOffchainStateTxn(): Promise<boolean> {
  if (!DEPLOYER_KEY || !DOOT_KEY || !ENDPOINT) {
    console.error("Missing required environment variables");
    return false;
  }

  try {
    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const dootPub = doot.toPublicKey();
    const deployer = PrivateKey.fromBase58(DEPLOYER_KEY);
    const deployerPub = deployer.toPublicKey();

    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);

    const dootAccountInfo = { publicKey: dootPub };
    const deployerAccountInfo = { publicKey: deployerPub };

    await Promise.all([
      fetchAccountWithRetry(dootAccountInfo),
      fetchAccountWithRetry(deployerAccountInfo),
    ]);

    const dootZkApp = new Doot(dootPub);
    dootZkApp.offchainState.setContractInstance(dootZkApp);

    console.log("Compiling offchain state...");
    await offchainState.compile();

    console.log("Creating settlement proof...");
    const proof = await dootZkApp.offchainState.createSettlementProof();

    console.log("Sending transaction...");
    const txn = await Mina.transaction(deployerPub, () =>
      dootZkApp.settle(proof)
    ).prove();

    const result = await txn.sign([deployer]).send();
    console.log("Transaction sent:", result.hash);

    return true;
  } catch (error) {
    console.error(
      "Offchain state transaction failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return false; // We return false instead of throwing since this is an application-level operation
  }
}

export default sendOffchainStateTxn;
