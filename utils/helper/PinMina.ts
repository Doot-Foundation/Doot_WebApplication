const JWT = process.env.PINATA_JWT;

const ORACLE_KEY: string | undefined = process.env.ORACLE_KEY;
const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const MINA_SECRET: string | undefined = process.env.MINA_SECRET;

import { Doot, IpfsCID } from "./Doot";

import {
  Poseidon,
  Mina,
  PrivateKey,
  CircuitString,
  MerkleMap,
  Field,
  fetchAccount,
} from "o1js";

async function frameKey(key: CircuitString) {
  return Poseidon.hash(key.toFields());
}

export default async function pinMinaObject(obj: { [key: string]: any }) {
  const Berkeley = Mina.Network(
    "https://proxy.berkeley.minaexplorer.com/graphql"
  );
  Mina.setActiveInstance(Berkeley);

  await Doot.compile();

  const transactionFee = 100_000_000;

  var doot;
  var oracle;
  var oraclePub;
  var dootPub;

  if (DOOT_KEY && ORACLE_KEY && MINA_SECRET) {
    console.log("Inside Here.");

    doot = PrivateKey.fromBase58(DOOT_KEY);
    oracle = PrivateKey.fromBase58(ORACLE_KEY);
    dootPub = doot.toPublicKey();
    oraclePub = oracle.toPublicKey();

    const accountInfo = {
      publicKey: dootPub,
    };
    await fetchAccount(accountInfo);

    const zkAppPublicKey = dootPub;

    const zkapp = new Doot(zkAppPublicKey);

    const Map = new MerkleMap();

    const minaKey = await frameKey(CircuitString.fromString("Mina"));
    const bitcoinKey = await frameKey(CircuitString.fromString("Bitcoin"));
    const chainlinkKey = await frameKey(CircuitString.fromString("Chainlink"));
    const solanaKey = await frameKey(CircuitString.fromString("Solana"));
    const ethereumKey = await frameKey(CircuitString.fromString("Ethereum"));

    const minaPrice = Field.from(obj.mina.price);
    const chainlinkPrice = Field.from(obj.chainlink.price);
    const solanaPrice = Field.from(obj.solana.price);
    const ethereumPrice = Field.from(obj.ethereum.price);
    const bitcoinPrice = Field.from(obj.bitcoin.price);

    Map.set(minaKey, minaPrice);
    Map.set(bitcoinKey, bitcoinPrice);
    Map.set(chainlinkKey, chainlinkPrice);
    Map.set(solanaKey, solanaPrice);
    Map.set(ethereumKey, ethereumPrice);

    const COMMITMENT = Map.getRoot();

    const minaWitness = Map.getWitness(minaKey);
    const chainlinkWitness = Map.getWitness(chainlinkKey);
    const solanaWitness = Map.getWitness(solanaKey);
    const bitcoinWitness = Map.getWitness(bitcoinKey);
    const ethereumWitness = Map.getWitness(ethereumKey);

    const timestamp = Date.now();
    const toUploadObject = {
      merkle_map: {
        last_updated: timestamp,
        commitment: COMMITMENT,
        keys: [ethereumKey, chainlinkKey, solanaKey, minaKey, bitcoinKey],
        values: [
          ethereumPrice,
          chainlinkPrice,
          solanaPrice,
          minaPrice,
          bitcoinPrice,
        ],
        witnesses: [
          ethereumWitness,
          chainlinkWitness,
          solanaWitness,
          minaWitness,
          bitcoinWitness,
        ],
      },
      assets: obj,
    };

    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${JWT}`,
      },
      body: JSON.stringify({
        pinataContent: toUploadObject,
        pinataMetadata: { name: `mina_${timestamp}.json` },
      }),
    };

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      options
    );
    const data = await response.json();
    const ipfs = data.IpfsHash;
    console.log(ipfs);

    const IPFS_HASH: IpfsCID = IpfsCID.fromString(ipfs);
    const SECRET: Field = Field.from(MINA_SECRET);

    const currentSecret = Field.from(await zkapp.secretToken.get()).toString();

    var txn;
    if (currentSecret == "0") {
      console.log("Init");
      txn = await Mina.transaction(
        { sender: oraclePub, fee: transactionFee },
        () => {
          zkapp.initBase(COMMITMENT, IPFS_HASH, SECRET);
        }
      );
      await txn.prove();
      txn.sign([oracle]).send();
    } else {
      console.log("Update");
      txn = await Mina.transaction(
        { sender: oraclePub, fee: transactionFee },
        () => {
          zkapp.updateBase(COMMITMENT, IPFS_HASH, SECRET);
        }
      );
      await txn.prove();
      await txn.sign([oracle]).send();
      console.log("Sent TXN.");
    }
    return ipfs;
  }
  // console.log(toUploadObject);
}
