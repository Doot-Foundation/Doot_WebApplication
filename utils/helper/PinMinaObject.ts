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

if (!JWT) {
  throw new Error("Missing PINATA_JWT environment variable");
}
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
  previousCID: string,
  networkPrefix: string = "mina"
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
        pinataMetadata: { name: `${networkPrefix}_${timestamp}.json` },
      }),
    };

    // SAFE PATTERN: Upload first, verify accessibility, then unpin old data
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options);

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error("No IpfsHash returned from Pinata");
    }

    // Critical: Verify the new CID returns valid data before unpinning old CID
    const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!GATEWAY) {
      throw new Error("Missing NEXT_PUBLIC_PINATA_GATEWAY environment variable");
    }

    try {
      const verificationResponse = await fetch(
        `https://${GATEWAY}/ipfs/${data.IpfsHash}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );

      if (!verificationResponse.ok) {
        throw new Error(`HTTP ${verificationResponse.status}: ${verificationResponse.statusText}`);
      }

      const verificationData = await verificationResponse.json();

      // Validate the data structure has required top-level properties
      if (!verificationData ||
          !verificationData.assets ||
          !verificationData.merkle_map) {
        throw new Error("Invalid data structure: missing 'assets' or 'merkle_map' properties");
      }
    } catch (verifyError) {
      throw new Error(`New IPFS CID ${data.IpfsHash} is not accessible: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }

    // Only NOW it's safe to unpin the old CID
    if (previousCID && previousCID !== "NULL") {
      try {
        await unpin(previousCID, networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1));
      } catch (unpinError) {
        // Don't fail the entire operation if unpinning fails
        console.warn(`Failed to unpin old CID ${previousCID}: ${unpinError instanceof Error ? unpinError.message : String(unpinError)}`);
      }
    }

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
