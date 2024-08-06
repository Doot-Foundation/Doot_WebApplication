const { redis } = require("../../../../utils/helper/init/InitRedis");
const {
  HISTORICAL_MAX_SIGNED_SLOT_CACHE,
  TOKEN_TO_SYMBOL,
} = require("../../../../utils/constants/info");

export default async function handler(req, res) {
  let { token } = req.query;
  if (token) token = token.toLowerCase();

  if (token != undefined && !TOKEN_TO_SYMBOL[token])
    return res
      .status(400)
      .json({ status: 400, message: "ERR! Invalid token." });

  const cachedData = await redis.get(HISTORICAL_MAX_SIGNED_SLOT_CACHE);

  if (cachedData) {
    if (token)
      return res.status(200).json({
        status: true,
        message: "Slot data found.",
        data: cachedData[token],
        asset: token,
      });
    else
      return res.status(200).json({
        status: true,
        message: "Slot data found.",
        data: cachedData,
        asset: token,
      });
  } else {
    return res.status(404).json({
      status: false,
      message: "Slot data not found.",
      data: null,
      asset: token,
    });
  }
}
