import { NextApiRequest, NextApiResponse } from "next";
// import { TOKEN_TO_CACHE } from "@/constants/info";

import { PublicKey, PrivateKey } from "o1js";

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
  res: NextApiResponse
) {
  const authHeader: string | undefined = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // res.status(200).json({ KEY: oracle_key.toBase58(), PUBLIC: oracle_public });
}

//LATEST MINA TRACKING UPDATED EVERY 2 HOURS - QmXqNayv2p92R4kVPQHi1rVpH18SW6wQjBdzjYSZKP7JoQ
