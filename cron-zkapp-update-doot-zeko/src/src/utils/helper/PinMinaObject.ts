import { unpin } from "./Unpin.js";
import { CircuitString, MerkleMap, Field } from "o1js";
import {
  uploadWithHashAndCleanup,
  downloadObject,
} from "./supabaseStorage.js";

function isSupabaseCid(cid: string | null | undefined): boolean {
  return typeof cid === "string" && cid.startsWith("supabase-");
}

function buildSupabaseCid(objectPath: string): string {
  const bucket =
    process.env.SUPABASE_HISTORICAL_BUCKET ||
    process.env.SUPABASE_PRICE_BUCKET ||
    "fallback";
  return `supabase-${bucket}-${objectPath}`;
}

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
  let unpinned = false;
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

    const serializedPayload = JSON.stringify(toUploadObject);

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

    let data: { IpfsHash: string } = { IpfsHash: "" };
    let pinataSucceeded = false;
    try {
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        options
      );

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
      }

      data = await response.json();

      if (!data.IpfsHash) {
        throw new Error("No IpfsHash returned from Pinata");
      }
      pinataSucceeded = true;
    } catch (pinErr) {
      console.warn(
        `Pinata upload failed, using Supabase CID instead: ${
          pinErr instanceof Error ? pinErr.message : String(pinErr)
        }`
      );
    }

    const prefix = (process.env.SUPABASE_ZEKO_PREFIX || "zeko").replace(
      /^\/+|\/+$/g,
      ""
    );
    const objectPath = `${prefix}_${timestamp}.json`;
    const pointerPath = `${prefix}_latest.json`;
    const supabaseCid = buildSupabaseCid(objectPath);
    await uploadWithHashAndCleanup({
      objectPath,
      pointerPath,
      serializedPayload,
      updatedAt: timestamp,
      cleanupPrefix: prefix,
      cid: data.IpfsHash || supabaseCid,
    });

    if (pinataSucceeded && data.IpfsHash) {
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
        console.warn(
          `IPFS verification failed (${verifyError instanceof Error ? verifyError.message : String(verifyError)}). Attempting Supabase fallback...`
        );
        try {
          const downloaded = await downloadObject({ objectPath });
          const parsed = JSON.parse(downloaded);
          if (!parsed?.assets || !parsed?.merkle_map) {
            throw new Error("Supabase fallback data missing required properties");
          }
        } catch (fallbackErr) {
          throw new Error(
            `Supabase fallback verification failed for ${objectPath}: ${
              fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
            }`
          );
        }
      }
    }

    if (previousCID && previousCID !== "NULL" && !isSupabaseCid(previousCID)) {
      try {
        await unpin(
          previousCID,
          networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1)
        );
        unpinned = true;
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
  } finally {
    // Best-effort unpin if main path failed before unpinning
    if (!unpinned && previousCID && previousCID !== "NULL" && !isSupabaseCid(previousCID)) {
      try {
        await unpin(
          previousCID,
          networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1)
        );
        console.log(`Best-effort unpin succeeded for ${previousCID}`);
      } catch (err) {
        console.warn(
          `Best-effort unpin failed for ${previousCID}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }
}
