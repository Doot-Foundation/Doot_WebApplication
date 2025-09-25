const axios = require("axios");
const unpin = require("./Unpin");

let o1js = null;

async function loadO1js() {
  if (!o1js) {
    o1js = await import("o1js");
  }
  return o1js;
}

// Constants
const JWT = process.env.PINATA_JWT;
const ASSETS = [
  "mina",
  "bitcoin",
  "chainlink",
  "solana",
  "ethereum",
  "polygon",
  "avalanche",
  "dogecoin",
  "ripple",
  "cardano",
];

async function pinMinaObject(obj, previousCID) {
  try {
    const { CircuitString, MerkleMap, Field } = await loadO1js();
    const Map = new MerkleMap();

    const processedAssets = ASSETS.map((asset) => {
      return {
        name: asset,
        key: CircuitString.fromString(asset).hash(),
        price: Field.from(obj[asset].price),
      };
    });

    processedAssets.forEach((asset) => {
      Map.set(asset.key, asset.price);
    });

    const COMMITMENT = Map.getRoot();
    const witnesses = processedAssets.map((asset) => Map.getWitness(asset.key));

    const timestamp = Date.now();

    const toUploadObject = {
      assets: obj,
      merkle_map: {
        pinnedAt: timestamp,
        commitment: COMMITMENT,
        keys: processedAssets.map((a) => a.key),
        values: processedAssets.map((a) => a.price),
        witnesses,
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

    console.log(" Uploading to IPFS...");
    const [response] = await Promise.all([
      fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options),
      previousCID && previousCID !== "NULL"
        ? unpin(previousCID, "Mina")
        : Promise.resolve(),
    ]);

    const data = await response.json();
    console.log("Pinned Mina Object:", data);

    return [data.IpfsHash, COMMITMENT.toString()];
  } catch (error) {
    console.error(
      "Error pinning Mina object:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

module.exports = pinMinaObject;
