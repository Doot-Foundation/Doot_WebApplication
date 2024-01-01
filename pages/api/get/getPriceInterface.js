import { getCache } from "../../../utils/helper/CacheHandler.js";

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  // Retrieve data from the cache
  const authHeader = req.headers.authorization;
  const { token } = req.query;

  console.log(authHeader, KEY);
  console.log(authHeader == "Bearer " + KEY);

  if ("Bearer " + KEY != authHeader) {
    res.status(401).json("Unauthorized.");
    return;
  }

  const cachedData = await getCache(token.toLowerCase());
  console.log(token);
  console.log(cachedData);

  if (cachedData) {
    return res
      .status(200)
      .json({ Price: cachedData, Asset: token, Timestamp: Date.now() });
  } else {
    return res.status(404).json({ message: "Cached data not found." });
  }
}
