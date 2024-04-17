import { redis } from "../../../utils/helper/InitRedis";
import { HISTORICAL_CACHE } from "../../../utils/constants/info";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  res.status(200).json("Init Cache!");
}
