import { unpin } from "./Unpin.js";
import { CircuitString, MerkleMap, Field } from "o1js";

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
];

interface TokenData {
  price: string;
  [key: string]: any;
}

interface TokenDataMap {
  [key: string]: TokenData;
}

export async function pinMinaObject(
  obj: TokenDataMap,
  previousCID: string,
  networkPrefix: string = "mina"
): Promise<[string, string]> {
  try {
    const Map = new MerkleMap();

    const processedAssets = ASSETS.map((asset) => ({
      name: asset,
      key: CircuitString.fromString(asset).hash(),
      price: Field.from(obj[asset.toLowerCase()].price),
    }));

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
        pinataMetadata: { name: `${networkPrefix}_${timestamp}.json` },
      }),
    };

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      options
    );

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error("No IpfsHash returned from Pinata");
    }

    const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    if (!GATEWAY) {
      throw new Error("Missing NEXT_PUBLIC_PINATA_GATEWAY environment variable");
    }

    try {
      const verificationResponse = await fetch(
        `https://${GATEWAY}/ipfs/${data.IpfsHash}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!verificationResponse.ok) {
        throw new Error(`HTTP ${verificationResponse.status}: ${verificationResponse.statusText}`);
      }

      const verificationData = await verificationResponse.json();

      if (
        !verificationData ||
        !verificationData.assets ||
        !verificationData.merkle_map
      ) {
        throw new Error(
          "Invalid data structure: missing 'assets' or 'merkle_map' properties"
        );
      }
    } catch (verifyError) {
      throw new Error(
        `New IPFS CID ${data.IpfsHash} is not accessible: ${
          verifyError instanceof Error ? verifyError.message : String(verifyError)
        }`
      );
    }

    if (previousCID && previousCID !== "NULL") {
      try {
        await unpin(
          previousCID,
          networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1)
        );
      } catch (unpinError) {
        console.warn(
          `Failed to unpin old CID ${previousCID}: ${
            unpinError instanceof Error ? unpinError.message : String(unpinError)
          }`
        );
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