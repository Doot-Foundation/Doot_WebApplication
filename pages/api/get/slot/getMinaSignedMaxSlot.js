import { redis } from "../../../../utils/helper/InitRedis";
import { MINA_SIGNED_MAX_CACHE } from "../../../../utils/constants/info";
const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const { token } = req.query;

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  const cachedData = await redis.get(MINA_SIGNED_MAX_CACHE);

  if (cachedData) {
    return res
      .status(200)
      .json({ information: cachedData, asset: token, timestamp: Date.now() });
  } else {
    return res.status(404).json({ message: "Cached data not found." });
  }
}
