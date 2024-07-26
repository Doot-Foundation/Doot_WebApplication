const { redis } = require("../../../../utils/helper/init/InitRedis");
const {
  TOKEN_TO_SIGNED_SLOT,
  TOKEN_TO_SYMBOL,
} = require("../../../../utils/constants/info");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  let { token } = req.query;
  token.toLowerCase();

  if (!TOKEN_TO_SYMBOL[token])
    return res
      .status(400)
      .json({ status: 400, message: "ERR! Invalid token." });

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  const cachedData = await redis.get(TOKEN_TO_SIGNED_SLOT[token.toLowerCase()]);

  if (cachedData) {
    return res.status(200).json({
      data: cachedData,
      asset: token,
      status: true,
      message: "Token slot information found.",
    });
  } else {
    return res.status(404).json({
      data: null,
      asset: token,
      status: false,
      message: "Token slot information not found.",
    });
  }
}
