const { redis } = require("../../../../utils/helper/InitRedis");
const { TOKEN_TO_GRAPH_DATA } = require("../../../../utils/constants/info");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  let { token } = req.query;
  token = token.toLowerCase();

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  const cachedData = await redis.get(TOKEN_TO_GRAPH_DATA[token]);

  if (cachedData) {
    return res.status(200).json({
      status: true,
      data: cachedData,
      asset: token,
      message: "Graph data found.",
    });
  } else {
    return res.status(404).json({
      status: false,
      data: {},
      asset: token,
      message: "Graph data not found.",
    });
  }
}
