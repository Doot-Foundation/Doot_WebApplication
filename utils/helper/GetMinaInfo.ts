import { Doot, IpfsCID } from "@/utils/constants/Doot";
import { Mina, fetchAccount, PublicKey } from "o1js";
import axios from "axios";
import { downloadObject } from "./supabaseStorage";

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
const DOOT_PUBLIC_KEY = process.env.NEXT_PUBLIC_MINA_DOOT_PUBLIC_KEY;
const SUPABASE_MINA_PREFIX = (
  process.env.SUPABASE_MINA_PREFIX || "mina"
).replace(/^\/+|\/+$/g, "");

interface MinaDetails {
  IpfsHash: string;
  deployerAddress: string;
  commitment: string;
  IpfsData: Record<string, any>;
}

interface AccountInfo {
  publicKey: PublicKey;
}

/**
 * Fetches Mina blockchain details with proper error handling
 */
async function getMinaDetails(cid: string): Promise<MinaDetails | undefined> {
  if (!GATEWAY || !ENDPOINT || !DOOT_PUBLIC_KEY) {
    console.error("Missing required environment variables");
    return undefined;
  }

  try {
    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);
    const zkAppAddress = PublicKey.fromBase58(DOOT_PUBLIC_KEY);

    const accountInfo: AccountInfo = {
      publicKey: zkAppAddress,
    };

    // Fetch account state first
    await fetchAccount(accountInfo);

    const zkapp = new Doot(zkAppAddress);

    // Then fetch other chain data in parallel
    const [tempIpfs, onChainDeployer, onChainCommitment] = await Promise.all([
      zkapp.ipfsCID.get(),
      zkapp.owner.get(),
      zkapp.commitment.get(),
    ]);

    const onChainIpfsCid = IpfsCID.fromCharacters(
      IpfsCID.unpack(tempIpfs.packed)
    ).toString();

    // Prepare base response
    const baseResponse: MinaDetails = {
      IpfsHash: onChainIpfsCid,
      deployerAddress: PublicKey.from(onChainDeployer).toBase58(),
      commitment: onChainCommitment.toString(),
      IpfsData: {},
    };

    // Only fetch IPFS data if CID matches
    if (cid === onChainIpfsCid) {
      try {
        const response = await axios.get(
          `https://${GATEWAY}/ipfs/${onChainIpfsCid}`,
          {
            timeout: 10000,
            headers: {
              Accept: "application/json",
            },
          }
        );
        baseResponse.IpfsData = response.data;
      } catch (ipfsErr) {
        // Fallback to Supabase public bucket
        try {
          const pointerPath = `${SUPABASE_MINA_PREFIX}_latest.json`;
          let objectPath = `${SUPABASE_MINA_PREFIX}_${onChainIpfsCid}.json`;
          try {
            const pointerRaw = await downloadObject({ objectPath: pointerPath });
            const pointer = JSON.parse(pointerRaw);
            if (pointer?.object_path) {
              objectPath = pointer.object_path;
            }
          } catch {
            // ignore pointer fetch failures; fall back to cid-based path
          }
          const data = await downloadObject({ objectPath });
          baseResponse.IpfsData = JSON.parse(data);
        } catch (fallbackErr) {
          console.error(
            `Failed to fetch Mina IPFS data via IPFS (${(ipfsErr as any).message}); Supabase fallback failed: ${(fallbackErr as any).message}`
          );
        }
      }
    }

    return baseResponse;
  } catch (error) {
    console.error(
      "Failed to fetch Mina details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

/**
 * Fetches IPFS information with timeout and error handling
 */
async function getToPinIPFSInformation(cid: string) {
  try {
    const response = await axios.get(`https://${GATEWAY}/ipfs/${cid}`, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      `Failed to fetch IPFS data for CID ${cid}:`,
      error instanceof Error ? error.message : "Unknown error"
    );

    try {
      const pointerPath = `${SUPABASE_MINA_PREFIX}/latest.json`;
      let objectPath = `${SUPABASE_MINA_PREFIX}_${cid}.json`;
      try {
        const pointerRaw = await downloadObject({ objectPath: pointerPath });
        const pointer = JSON.parse(pointerRaw);
        if (pointer?.object_path) {
          objectPath = pointer.object_path;
        }
      } catch {
        // ignore pointer fetch failures; fall back to cid-based path
      }
      const data = await downloadObject({ objectPath });
      return JSON.parse(data);
    } catch (fallbackErr) {
      console.error(
        `Supabase fallback failed for Mina CID ${cid}: ${
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        }`
      );
      throw error;
    }
  }
}

export { getToPinIPFSInformation, getMinaDetails };
