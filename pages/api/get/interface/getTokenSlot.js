const { redis } = require("@/utils/helper/init/InitRedis");
const {
  TOKEN_TO_SIGNED_SLOT,
  TOKEN_TO_SYMBOL,
} = require("@/utils/constants/info");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  let { token } = req.query;

  if (token != undefined && !TOKEN_TO_SYMBOL[token])
    return res
      .status(400)
      .json({ status: 400, message: "ERR! Invalid token." });

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  let cachedData = [{}];
  if (token != undefined) {
    token = token.toLowerCase();
    const data = await redis.get(TOKEN_TO_SIGNED_SLOT[token]);
    cachedData[0][token] = data;
  } else {
    const keys = Object.keys(TOKEN_TO_SYMBOL);
    for (let key of keys) {
      const data = await redis.get(TOKEN_TO_SIGNED_SLOT[key]);
      cachedData[0][key] = data;
    }
  }

  return res.status(200).json({
    data: cachedData,
    asset: token ? token : "ALL",
    status: true,
    message: "Token slot information found.",
  });
}
