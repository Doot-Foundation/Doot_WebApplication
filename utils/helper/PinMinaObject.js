const axios = require("axios");
const unpin = require("./Unpin");

// We'll import o1js dynamically to avoid import issues
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
    console.log("🔧 Loading o1js...");
    const { CircuitString, MerkleMap, Field } = await loadO1js();
    console.log("✅ o1js loaded successfully");

    console.log("🔧 Creating MerkleMap...");
    const Map = new MerkleMap();

    console.log("🔧 Processing assets...");
    // Process assets in parallel
    const processedAssets = ASSETS.map((asset) => {
      console.log(`  📊 Processing ${asset}, price: ${obj[asset]?.price}`);
      return {
        name: asset,
        key: CircuitString.fromString(asset).hash(),
        price: Field.from(obj[asset].price),
      };
    });

    console.log("🔧 Setting MerkleMap values...");
    // Set all values in the MerkleMap
    processedAssets.forEach((asset) => {
      Map.set(asset.key, asset.price);
    });

    console.log("🔧 Getting MerkleMap root...");
    const COMMITMENT = Map.getRoot();

    console.log("🔧 Getting witnesses...");
    // Get all witnesses in parallel
    const witnesses = processedAssets.map((asset) => Map.getWitness(asset.key));

    const timestamp = Date.now();

    console.log("🔧 Preparing upload object...");
    // Prepare upload object
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

    console.log("🔧 Preparing IPFS upload...");
    // Prepare upload options
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

    console.log("🔧 Uploading to IPFS...");
    // Upload to IPFS and unpin old data in parallel if it exists
    const [response] = await Promise.all([
      fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options),
      previousCID && previousCID !== "NULL" ? unpin(previousCID, "Mina") : Promise.resolve(),
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