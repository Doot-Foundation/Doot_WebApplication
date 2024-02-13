const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const ENDPOINT = process.env.NEXT_PUBLIC_MINA_ENDPOINT;

import { Doot, IpfsCID } from "./Doot";
import { Mina, fetchAccount, PublicKey } from "o1js";

export default async function getMinaDetails(latestCID: string): Promise<
  | {
      [key: string]: any;
    }
  | undefined
> {
  if (GATEWAY && ENDPOINT) {
    const axios = require("axios");
    const Berkeley = Mina.Network(ENDPOINT);
    Mina.setActiveInstance(Berkeley);

    const zkAppAddress = PublicKey.fromBase58(
      "B62qjaQEw1PcdETvJyLMtKxYgz8GAXv3cGeJ575Cgf3Hpw5qybr1jFE"
    );
    const accountInfo: any = {
      publicKey: zkAppAddress,
    };
    await fetchAccount(accountInfo);
    const zkapp = new Doot(zkAppAddress);

    const onChainOracle = PublicKey.from(await zkapp.oraclePublicKey.get());
    const onChainCommitment = await zkapp.commitment.get().toString();
    const onChainIpfsCID = await zkapp.ipfsCID.get();
    const onChainIpfsCid = IpfsCID.fromCharacters(
      IpfsCID.unpack(onChainIpfsCID.packed)
    ).toString();

    if (latestCID == onChainIpfsCid) {
      const res = await axios.get(`https://${GATEWAY}/ipfs/${onChainIpfsCid}`);
      const ipfsData = res.data;

      return {
        IpfsHash: onChainIpfsCid.toString(),
        oracleAddress: onChainOracle.toBase58().toString(),
        commitment: onChainCommitment,
        IpfsData: ipfsData,
      };
    } else {
      return {
        IpfsHash: onChainIpfsCid.toString(),
        oracleAddress: onChainOracle.toBase58().toString(),
        commitment: onChainCommitment,
        IpfsData: {
          message:
            "CID Mismatch! Please try again in a few minutes to see the latest information.",
        },
      };
    }
  }
}
