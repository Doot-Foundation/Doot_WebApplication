const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;

import { Doot, IpfsCID } from "./Doot";

import { Mina, PrivateKey, Field, fetchAccount } from "o1js";

export default async function sendMinaTxn(array: string[]) {
  console.log(array);
  try {
    if (ORACLE_KEY && DOOT_KEY && MINA_SECRET) {
      console.log("Reached 0");
      const COMMITMENT = Field.from(array[1]);
      const IPFS_HASH: IpfsCID = IpfsCID.fromString(array[0]);
      const SECRET: Field = Field.from(MINA_SECRET);
      console.log("Reached 1");

      const doot = PrivateKey.fromBase58(DOOT_KEY);
      const oracle = PrivateKey.fromBase58(ORACLE_KEY);
      const oraclePub = oracle.toPublicKey();
      const dootPub = doot.toPublicKey();

      console.log("Reached 2");
      const Berkeley = Mina.Network(
        "https://proxy.berkeley.minaexplorer.com/graphql"
      );
      Mina.setActiveInstance(Berkeley);
      console.log("Reached 3");
      await Doot.compile();
      console.log("Reached 4");
      const accountInfo = {
        publicKey: dootPub,
      };
      await fetchAccount(accountInfo);
      console.log("Reached 5");
      const transactionFee = 100_000_000;

      const zkapp = new Doot(dootPub);

      const currentSecret = Field.from(
        await zkapp.secretToken.get()
      ).toString();

      var txn;
      if (currentSecret == "0") {
        console.log("Init");
        txn = await Mina.transaction(
          { sender: oraclePub, fee: transactionFee },
          () => {
            zkapp.initBase(COMMITMENT, IPFS_HASH, SECRET);
          }
        );
      } else {
        console.log("Update");
        txn = await Mina.transaction(
          { sender: oraclePub, fee: transactionFee },
          () => {
            zkapp.updateBase(COMMITMENT, IPFS_HASH, SECRET);
          }
        );
      }
      console.log("Reached 6");
      await txn.prove();
      console.log("Reached 7");
      txn.sign([oracle]).send();
      console.log("Sent!");
      return true;
    }
  } catch (err) {
    return false;
  }
}
