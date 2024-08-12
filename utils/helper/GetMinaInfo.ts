const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;
const DOOT_PUBLIC_KEY = process.env.NEXT_PUBLIC_DOOT_PUBLIC_KEY;

import { Doot, IpfsCID } from "../constants/Doot";
import { Mina, fetchAccount, PublicKey } from "o1js";

async function getMinaDetails(cid: string): Promise<
  | {
      [key: string]: any;
    }
  | undefined
> {
  if (GATEWAY && ENDPOINT && DOOT_PUBLIC_KEY) {
    const axios = require("axios");

    const Devnet = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Devnet);

    const zkAppAddress = PublicKey.fromBase58(DOOT_PUBLIC_KEY);
    const accountInfo: any = {
      publicKey: zkAppAddress,
    };
    await fetchAccount(accountInfo);
    const zkapp = new Doot(zkAppAddress);

    const tempIpfs = await zkapp.ipfsCID.get();
    const onChainDeployer = PublicKey.from(await zkapp.deployerPublicKey.get());
    const onChainCommitment = await zkapp.commitment.get().toString();
    const onChainIpfsCid = IpfsCID.fromCharacters(
      IpfsCID.unpack(tempIpfs.packed)
    ).toString();

    // Just to check if the CID they have by fetching from the application's api endpoints is what's on-chain.
    // That way we can have a level field and only return results if the results are consistent.
    if (cid == onChainIpfsCid) {
      const res = await axios.get(`https://${GATEWAY}/ipfs/${onChainIpfsCid}`);
      const ipfsData = res.data;

      return {
        IpfsHash: onChainIpfsCid.toString(),
        deployerAddress: onChainDeployer.toBase58().toString(),
        commitment: onChainCommitment,
        IpfsData: ipfsData,
      };
    } else {
      return {
        IpfsHash: onChainIpfsCid.toString(),
        deployerAddress: onChainDeployer.toBase58().toString(),
        commitment: onChainCommitment,
        IpfsData: {},
      };
    }
  }
}

async function getToPinIPFSInformation(cid: string) {
  const axios = require("axios");
  const res = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
  const ipfsData = res.data;

  return ipfsData;
}
module.exports = { getToPinIPFSInformation, getMinaDetails };
