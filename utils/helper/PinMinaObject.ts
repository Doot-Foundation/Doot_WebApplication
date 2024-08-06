const JWT = process.env.PINATA_JWT;
import unpin from "./Unpin";
import { CircuitString, MerkleMap, Field } from "o1js";

async function frameKey(key: CircuitString) {
  return key.hash();
}

async function pinMinaObject(obj: { [key: string]: any }, previousCID: string) {
  const Map = new MerkleMap();

  const minaKey = await frameKey(CircuitString.fromString("Mina"));
  const bitcoinKey = await frameKey(CircuitString.fromString("Bitcoin"));
  const chainlinkKey = await frameKey(CircuitString.fromString("Chainlink"));
  const solanaKey = await frameKey(CircuitString.fromString("Solana"));
  const ethereumKey = await frameKey(CircuitString.fromString("Ethereum"));
  const polygonKey = await frameKey(CircuitString.fromString("Polygon"));
  const avalancheKey = await frameKey(CircuitString.fromString("Avalanche"));
  const dogeKey = await frameKey(CircuitString.fromString("Dogecoin"));
  const rippleKey = await frameKey(CircuitString.fromString("Ripple"));
  const cardanoKey = await frameKey(CircuitString.fromString("Cardano"));

  const minaPrice = Field.from(obj.mina.price);
  const chainlinkPrice = Field.from(obj.chainlink.price);
  const solanaPrice = Field.from(obj.solana.price);
  const ethereumPrice = Field.from(obj.ethereum.price);
  const bitcoinPrice = Field.from(obj.bitcoin.price);
  const polygonPrice = Field.from(obj.polygon.price);
  const avalanchePrice = Field.from(obj.avalanche.price);
  const dogePrice = Field.from(obj.dogecoin.price);
  const ripplePrice = Field.from(obj.ripple.price);
  const cardanoPrice = Field.from(obj.cardano.price);

  Map.set(minaKey, minaPrice);
  Map.set(bitcoinKey, bitcoinPrice);
  Map.set(chainlinkKey, chainlinkPrice);
  Map.set(solanaKey, solanaPrice);
  Map.set(ethereumKey, ethereumPrice);
  Map.set(polygonKey, polygonPrice);
  Map.set(avalancheKey, avalanchePrice);
  Map.set(dogeKey, dogePrice);
  Map.set(rippleKey, ripplePrice);
  Map.set(cardanoKey, cardanoPrice);

  const COMMITMENT = Map.getRoot();

  const minaWitness = Map.getWitness(minaKey);
  const chainlinkWitness = Map.getWitness(chainlinkKey);
  const solanaWitness = Map.getWitness(solanaKey);
  const bitcoinWitness = Map.getWitness(bitcoinKey);
  const ethereumWitness = Map.getWitness(ethereumKey);
  const polygonWitness = Map.getWitness(polygonKey);
  const avalancheWitness = Map.getWitness(avalancheKey);
  const dogeWitness = Map.getWitness(dogeKey);
  const rippleWitness = Map.getWitness(rippleKey);
  const cardanoWitness = Map.getWitness(cardanoKey);

  const timestamp = Date.now();
  const toUploadObject = {
    assets: obj,
    merkle_map: {
      pinnedAt: timestamp,
      commitment: COMMITMENT,
      keys: [
        ethereumKey,
        chainlinkKey,
        solanaKey,
        minaKey,
        bitcoinKey,
        polygonKey,
        avalancheKey,
        dogeKey,
        rippleKey,
        cardanoKey,
      ],
      values: [
        ethereumPrice,
        chainlinkPrice,
        solanaPrice,
        minaPrice,
        bitcoinPrice,
        polygonPrice,
        avalanchePrice,
        dogePrice,
        ripplePrice,
        cardanoPrice,
      ],
      witnesses: [
        ethereumWitness,
        chainlinkWitness,
        solanaWitness,
        minaWitness,
        bitcoinWitness,
        polygonWitness,
        avalancheWitness,
        dogeWitness,
        rippleWitness,
        cardanoWitness,
      ],
    },
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
  console.log("Pinned Mina Object.");
  console.log(data);

  if (previousCID) await unpin(previousCID, "Mina");

  return [IPFS, COMMITMENT.toString()];
}

module.exports = pinMinaObject;
