import { redis } from "../../../utils/helper/InitRedis";
import {
  HISTORICAL_CACHE,
  TOKEN_TO_CACHE,
  MINA_CACHE,
} from "../../../utils/constants/info";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  await redis.set(MINA_CACHE, "NULL");
  await redis.set(HISTORICAL_CACHE, "NULL");

  const keys = Object.keys(TOKEN_TO_CACHE);
  for (const item of keys) {
    await redis.set(TOKEN_TO_CACHE[item], "NULL");
  }

  res.status(200).json("Cleared Cache!");
}
