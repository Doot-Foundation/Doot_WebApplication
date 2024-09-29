const { redis } = require("../../../../utils/helper/init/InitRedis");
const {
  TOKEN_TO_CACHE,
  TOKEN_TO_SYMBOL,
} = require("../../../../utils/constants/info");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  let { token } = req.query;

  if (token) {
    token = token.toLowerCase();

    if (!TOKEN_TO_SYMBOL[token])
      return res
        .status(400)
        .json({ status: 400, message: "ERR! Invalid token." });

    if ("Bearer " + KEY != authHeader) {
      return res.status(401).json("Unauthorized.");
    }

    /// Instead of this, return data from historical.
    const cachedData = await redis.get(TOKEN_TO_CACHE[token]);

    if (cachedData) {
      return res.status(200).json({
        status: true,
        data: cachedData,
        asset: token,
        message: "Price data found.",
      });
    } else {
      return res.status(404).json({
        status: false,
        data: null,
        asset: token,
        message: "Price data not found.",
      });
    }
  }
  return res
    .status(400)
    .json({ status: 400, message: "ERR! Query parameter missing(token)." });
}
