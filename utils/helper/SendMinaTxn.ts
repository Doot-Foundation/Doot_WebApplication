const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;
const ENDPOINT: string | undefined = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

import { Doot, IpfsCID, PricesArray } from "../constants/Doot";
import { Mina, PrivateKey, Field, fetchAccount, UInt64 } from "o1js";
import { DootFileSystem, fetchFiles } from "./LoadCache";
import axios from "axios";

export default async function sendMinaTxn(array: string[], prices: bigint[]) {
  // console.log(array);
  if (ORACLE_KEY && DOOT_KEY && MINA_SECRET && ENDPOINT) {
    const COMMITMENT = Field.from(array[1]);
    const IPFS_HASH: IpfsCID = IpfsCID.fromString(array[0]);
    const SECRET: Field = Field.from(MINA_SECRET);
    const PRICES: PricesArray = new PricesArray({
      prices: prices.map((e) => Field.from(e)),
    });

    const doot = PrivateKey.fromBase58(DOOT_KEY);
    const dootPub = doot.toPublicKey();
    const oracle = PrivateKey.fromBase58(ORACLE_KEY);
    const oraclePub = oracle.toPublicKey();

    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);

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
    const dootZkApp = new Doot(dootPub);

    console.log("Proving and sending txn...");

    const txn = await Mina.transaction(oraclePub, async () => {
      await dootZkApp.update(COMMITMENT, IPFS_HASH, PRICES, SECRET);
    }).prove();
    console.log("Proved.");

    const res = await txn.sign([oracle]).send();

    console.log("Sent txn:", res.hash);
    return true;
  }
}
