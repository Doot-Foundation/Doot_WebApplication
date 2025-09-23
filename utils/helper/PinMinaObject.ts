import unpin from "./Unpin";
import { CircuitString, MerkleMap, Field } from "o1js";

// Types
interface CryptoAsset {
  price: string | number;
}

interface AssetObject {
  [key: string]: CryptoAsset;
}

interface UploadObject {
  assets: AssetObject;
  merkle_map: {
    pinnedAt: number;
    commitment: Field;
    keys: Field[];
    values: Field[];
    witnesses: any[]; // Using any since o1js witness type isn't exposed
  };
}

// Constants
const JWT = process.env.PINATA_JWT;
const ASSETS = [
  "Mina",
  "Bitcoin",
  "Chainlink",
  "Solana",
  "Ethereum",
  "Polygon",
  "Avalanche",
  "Dogecoin",
  "Ripple",
  "Cardano",
] as const;

async function pinMinaObject(
  obj: AssetObject,
  previousCID: string
): Promise<[string, string]> {
  try {
    const Map = new MerkleMap();

    // Process assets in parallel
    const processedAssets = ASSETS.map((asset) => ({
      name: asset,
      key: CircuitString.fromString(asset).hash(),
      price: Field.from(obj[asset.toLowerCase()].price),
    }));

    // Set all values in the MerkleMap
    processedAssets.forEach((asset) => {
      Map.set(asset.key, asset.price);
    });

    const COMMITMENT = Map.getRoot();

    // Get all witnesses in parallel
    const witnesses = processedAssets.map((asset) => Map.getWitness(asset.key));

    const timestamp = Date.now();

    // Prepare upload object
    const toUploadObject: UploadObject = {
      assets: obj,
      merkle_map: {
        pinnedAt: timestamp,
        commitment: COMMITMENT,
        keys: processedAssets.map((a) => a.key),
        values: processedAssets.map((a) => a.price),
        witnesses,
      },
    };

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

    // Upload to IPFS and unpin old data in parallel if it exists
    const [response] = await Promise.all([
      fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options),
      previousCID ? unpin(previousCID, "Mina") : Promise.resolve(),
    ]);

    const data = await response.json();
    console.log("Pinned Mina Object:", data);

    return [data.IpfsHash, COMMITMENT.toString()];
  } catch (error) {
    console.error(
      "Error pinning Mina object:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

export default pinMinaObject;
