// pages/api/get.js
import { getCache } from "../../../utils/CacheHandler.js";

export default function handler(req, res) {
  // Retrieve data from the cache

  const { token } = req.query;
  const cachedData = getCache(token);

  if (cachedData) {
    return res.status(200).json({ price: cachedData });
  } else {
    return res.status(404).json({ message: "Cached data not found" });
  }
}
