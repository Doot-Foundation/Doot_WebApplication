import { redis } from "../../../utils/helper/InitRedis";
import { SLOT_STATUS_CACHE } from "../../../utils/constants/info";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  await redis.set(SLOT_STATUS_CACHE, false);

  res.status(200).json("Init Cache!");
}
