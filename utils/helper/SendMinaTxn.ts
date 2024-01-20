const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;

import { Doot, IpfsCID } from "./Doot";
import { DootFileSystem, fetchFiles } from "./LoadCache";
import { Mina, PrivateKey, Field, fetchAccount } from "o1js";

export default async function sendMinaTxn(array: string[]) {
  console.log(array);
  if (ORACLE_KEY && DOOT_KEY && MINA_SECRET) {
    const COMMITMENT = Field.from(array[1]);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(array[0]);
    const SECRET: Field = Field.from(MINA_SECRET);

    console.log("Reached 1");
    console.log(performance.now());
    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const oracle = PrivateKey.fromBase58(ORACLE_KEY);
    const oraclePub = oracle.toPublicKey();
    const dootPub = doot.toPublicKey();

    console.log("Reached 2");
    console.log(performance.now());
    const Berkeley = Mina.Network(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    Mina.setActiveInstance(Berkeley);

    console.log("Reached 3");
    console.log(performance.now());

    const accountInfo = {
      publicKey: dootPub,
    };
    await fetchAccount(accountInfo);

    console.log("Reached 4");
    console.log(performance.now());

    const cacheFiles = await fetchFiles();
    await Doot.compile({ cache: DootFileSystem(cacheFiles) });
    const zkapp = new Doot(dootPub);

    console.log("Reached 5");
    console.log(performance.now());
    const transactionFee = 100_000_000;

    console.log("Proving and sending txn...");
    const txn = await Mina.transaction(
      { sender: oraclePub, fee: transactionFee },
      () => {
        zkapp.updateBase(COMMITMENT, IPFS_HASH, SECRET);
      }
    );
    console.log("Reached 6");
    console.log(performance.now());
    await txn.prove();

    console.log("Reached 7");
    console.log(performance.now());
    const res = await txn.sign([oracle]).send();

    console.log("Sent txn:", res.hash());
    return true;
  }
}
