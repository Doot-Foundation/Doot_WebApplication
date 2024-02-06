const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;

import { Doot, IpfsCID } from "./Doot";
import { Mina, PrivateKey, Field, fetchAccount } from "o1js";
import { DootFileSystem, fetchFiles } from "./LoadCache";

export default async function sendMinaTxn(array: string[]) {
  console.log(array);
  if (ORACLE_KEY && DOOT_KEY && MINA_SECRET) {
    const COMMITMENT = Field.from(array[1]);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(array[0]);
    const SECRET: Field = Field.from(MINA_SECRET);

    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const oracle = PrivateKey.fromBase58(ORACLE_KEY);
    const oraclePub = oracle.toPublicKey();
    const dootPub = doot.toPublicKey();

    const Berkeley = Mina.Network(
      "https://api.minascan.io/node/berkeley/v1/graphql"
    );
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
    // await Doot.compile();
    // const zkapp = new Doot(dootPub);

    const transactionFee = 100_000_000;

    console.log("Proving and sending txn...");
    const txn = await Mina.transaction(
      { sender: oraclePub, fee: transactionFee },
      () => {
        zkapp.updateBase(COMMITMENT, IPFS_HASH, SECRET);
      }
    );
    await txn.prove();
    console.log("Proved.");

    const res = await txn.sign([oracle]).send();
    console.log("Sent txn:", res.hash());
    return true;
  }
}
