import unpin from "./Unpin";
import { CircuitString, MerkleMap, Field } from "o1js";
import { uploadWithHashAndCleanup, downloadObject } from "./supabaseStorage";

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

const SUPABASE_MINA_PREFIX = (
  process.env.SUPABASE_MINA_PREFIX || "mina"
).replace(/^\/+|\/+$/g, "");

async function pinMinaObject(
  obj: AssetObject,
  previousCID: string,
  networkPrefix: string = "mina"
): Promise<[string, string]> {
  let unpinned = false;
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

    let data: { IpfsHash: string } = { IpfsHash: "" };
    let pinataSucceeded = false;
    try {
      // SAFE PATTERN: Upload first, verify accessibility, then unpin old data
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

    // Supabase mirror + cleanup (always mirror, even if gateway is flaky)
    const objectPath = `${SUPABASE_MINA_PREFIX}_${timestamp}.json`;
    const pointerPath = `${SUPABASE_MINA_PREFIX}_latest.json`;
    const supabaseCid = buildSupabaseCid(objectPath);
    await uploadWithHashAndCleanup({
      objectPath,
      pointerPath,
      serializedPayload,
      updatedAt: timestamp,
      cleanupPrefix: SUPABASE_MINA_PREFIX,
      cid: data.IpfsHash || supabaseCid,
    });

    // Critical: Verify the new CID returns valid data before unpinning old CID.
    // If IPFS gateway is unreachable, fall back to Supabase object to avoid blocking.
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

    // Only NOW it's safe to unpin the old CID
    if (previousCID && previousCID !== "NULL" && !isSupabaseCid(previousCID)) {
      try {
        await unpin(previousCID, networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1));
        unpinned = true;
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
  } finally {
    // Best-effort unpin if main path failed before unpinning
    if (!unpinned && previousCID && previousCID !== "NULL" && !isSupabaseCid(previousCID)) {
      try {
        await unpin(previousCID, networkPrefix.charAt(0).toUpperCase() + networkPrefix.slice(1));
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

export default pinMinaObject;
