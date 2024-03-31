import { redis } from "../../../utils/helper/InitRedis";
import {
  HISTORICAL_SIGNED_MAX_CACHE,
  MINA_SIGNED_MAX_CACHE,
  TOKEN_TO_SIGNED_SLOT,
} from "../../../utils/constants/info";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const keys = Object.keys(TOKEN_TO_SIGNED_SLOT);
  const signedCacheInit = {};
  for (const item of keys) {
    await redis.set(TOKEN_TO_SIGNED_SLOT[item], "NULL");
    signedCacheInit[item] = { community: {} };
  }

  await redis.set(HISTORICAL_SIGNED_MAX_CACHE, signedCacheInit);
  await redis.set(MINA_SIGNED_MAX_CACHE, signedCacheInit);

  res.status(200).json("Init Cache!");
}
