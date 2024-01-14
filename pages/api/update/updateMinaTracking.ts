import type { NextApiRequest, NextApiResponse } from "next";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info_2.ts";
import { redis } from "../../../utils/helper/InitRedis.js";
import { PrivateKey } from "o1js";

type ResponseData = {
  message: { [key: string]: any } | string;
};

const key: string | undefined = process.env.ORACLE_KEY;
let oracle_key: PrivateKey;
let oracle_public: string;

if (key) {
  oracle_key = PrivateKey.fromBase58(key);
  oracle_public = oracle_key.toPublicKey().toBase58();
}
// const publicKey = PrivateKey(privateKey).toPublicKey().toString();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const authHeader: string | undefined = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const Obj: { [key: string]: any } = {};
  const keys: string[] = Object.keys(TOKEN_TO_CACHE);
  keys.forEach(async (key: string) => {
    const data = JSON.parse(await redis.get(TOKEN_TO_CACHE[key]));
    const asset: string = data.asset;
    Obj[`${asset}`] = data.information;
  });

  console.log(Obj);
  res.status(200).json({ message: Obj });
}

//LATEST MINA TRACKING UPDATED EVERY 2 HOURS - QmXqNayv2p92R4kVPQHi1rVpH18SW6wQjBdzjYSZKP7JoQ
