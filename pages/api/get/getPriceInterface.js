const { TOKEN_TO_CACHE } = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const { token } = req.query;

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);

  if (cachedData) {
    return res
      .status(200)
      .json({ information: cachedData, asset: token, timestamp: Date.now() });
  } else {
    return res.status(404).json({ message: "Cached data not found." });
  }
}
