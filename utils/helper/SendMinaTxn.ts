const DEPLOYER_KEY: string | undefined = process.env.DEPLOYER_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;
const ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

import { Doot, IpfsCID, PricesArray } from "../constants/Doot.js";
import { Mina, PrivateKey, Field, fetchAccount } from "o1js";
import { DootFileSystem, fetchFiles } from "./LoadCache";

async function sendMinaTxn(commitment: string, ipfs: string, prices: bigint[]) {
  if (DEPLOYER_KEY && DOOT_KEY && MINA_SECRET && ENDPOINT) {
    const COMMITMENT = Field.from(commitment);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(ipfs);
    const SECRET: Field = Field.from(MINA_SECRET);

    const PRICES: PricesArray = new PricesArray({
      prices: prices.map((e) => Field.from(e)),
    });

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

    const cacheFiles = await fetchFiles();
    await Doot.compile({ cache: DootFileSystem(cacheFiles) });
    const dootZkApp = new Doot(dootPub);

    console.log("Proving and sending txn...");

    const txn = await Mina.transaction(deployerPub, async () => {
      await dootZkApp.update(COMMITMENT, IPFS_HASH, PRICES, SECRET);
    }).prove();
    console.log("Proved.");

    const res = await txn.sign([deployer]).send();

    console.log("Sent txn:", res.hash);
    return true;
  }
}

module.exports = sendMinaTxn;
