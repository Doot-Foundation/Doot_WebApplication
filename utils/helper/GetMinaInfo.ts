const DOOT_KEY: string | undefined = process.env.DOOT_KEY;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

import { Doot, IpfsCID } from "./Doot";

import { Mina, PrivateKey, fetchAccount, PublicKey } from "o1js";

export default async function getMinaDetails(): Promise<
  | {
      [key: string]: any;
    }
  | undefined
> {
  const axios = require("axios");
  const Berkeley = Mina.Network(
    "https://proxy.berkeley.minaexplorer.com/graphql"
  );
  Mina.setActiveInstance(Berkeley);

  // await Doot.compile();

  var doot;
  var dootPub;

  if (DOOT_KEY) {
    doot = PrivateKey.fromBase58(DOOT_KEY);
    dootPub = doot.toPublicKey();

    const accountInfo: any = {
      publicKey: doot.toPublicKey(),
    };
    await fetchAccount(accountInfo);
    const zkAppPublicKey = dootPub;
    const zkapp = new Doot(zkAppPublicKey);

    const onChainIpfsCID = await zkapp.ipfsCID.get();
    const onChainIpfsCid = IpfsCID.fromCharacters(
      IpfsCID.unpack(onChainIpfsCID.packed)
    );

    const res = await axios.get(`https://${GATEWAY}/ipfs/${onChainIpfsCid}`);
    const ipfsData = res.data;
    const onChainOracle = PublicKey.from(await zkapp.oraclePublicKey.get());
    const onChainCommitment = await zkapp.commitment.get().toString();

    return {
      IpfsHash: onChainIpfsCid.toString(),
      oracleAddress: onChainOracle.toBase58().toString(),
      commitment: onChainCommitment,
      ipfs: ipfsData,
    };
  }
  // console.log(toUploadObject);
}
