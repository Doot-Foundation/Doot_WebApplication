const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;
const ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

import { Doot, IpfsCID, PricesArray } from "./Doot";
import { Mina, PrivateKey, Field, fetchAccount } from "o1js";
import { DootFileSystem, fetchFiles } from "./LoadCache";

export default async function sendMinaTxn(array: string[]) {
  console.log(array);
  if (ORACLE_KEY && DOOT_KEY && MINA_SECRET && ENDPOINT) {
    const COMMITMENT = Field.from(array[1]);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(array[0]);
    const SECRET: Field = Field.from(MINA_SECRET);

    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const dootPub = doot.toPublicKey();
    const oracle = PrivateKey.fromBase58(ORACLE_KEY);
    const oraclePub = oracle.toPublicKey();

    const Berkeley = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Berkeley);

    let accountInfo = {
      publicKey: dootPub,
    };
    await fetchAccount(accountInfo);
    accountInfo = {
      publicKey: oraclePub,
    };
    await fetchAccount(accountInfo);

    const cacheFiles = await fetchFiles();
    await Doot.compile({ cache: DootFileSystem(cacheFiles) });
    const zkapp = new Doot(dootPub);

    const transactionFee = 100_000_000;
    const PRICES = new PricesArray({ prices: [Field.from(0)] });

    console.log("Proving and sending txn...");
    const txn = await Mina.transaction(
      { sender: oraclePub, fee: transactionFee },
      () => {
        zkapp.update(COMMITMENT, IPFS_HASH, PRICES, SECRET);
      }
    );
    await txn.prove();
    console.log("Proved.");

    const res = await txn.sign([oracle]).send();
    console.log("Sent txn:", res.hash());
    return true;
  }
}
