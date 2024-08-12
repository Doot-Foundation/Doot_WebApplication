const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const DEPLOYER_KEY: string | undefined = process.env.DEPLOYER_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;
const ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

import { Doot, offchainState } from "../constants/Doot.js";
import { PrivateKey, Mina, fetchAccount } from "o1js";

export default async function sendOffchainStateTxn() {
  if (DEPLOYER_KEY && DOOT_KEY && MINA_SECRET && ENDPOINT) {
    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const dootPub = doot.toPublicKey();
    const deployer = PrivateKey.fromBase58(DEPLOYER_KEY);
    const deployerPub = deployer.toPublicKey();

    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);

    let accountInfo = {
      publicKey: dootPub,
    };
    await fetchAccount(accountInfo);
    accountInfo = {
      publicKey: deployerPub,
    };
    await fetchAccount(accountInfo);

    let dootZkApp = new Doot(dootPub);
    offchainState.setContractInstance(dootZkApp);
    await offchainState.compile();

    let proof = await offchainState.createSettlementProof();
    await Mina.transaction(deployerPub, () => dootZkApp.settle(proof))
      .prove()
      .sign([deployer])
      .send();

    return true;
  }
  return false;
}
