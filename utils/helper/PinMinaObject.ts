const JWT = process.env.PINATA_JWT;

import { Poseidon, CircuitString, MerkleMap, Field } from "o1js";

async function frameKey(key: CircuitString) {
  return Poseidon.hash(key.toFields());
}

export default async function pinMinaObject(obj: { [key: string]: any }) {
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
  const IPFS = data.IpfsHash;
  return [IPFS, COMMITMENT.toString()];
}
