import { redis } from "../../../utils/helper/InitRedis";
import { TOKEN_TO_GRAPH_DATA } from "../../../utils/constants/info";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const keys = Object.keys(TOKEN_TO_GRAPH_DATA);

  for (let key of keys) {
    await redis.set(TOKEN_TO_GRAPH_DATA[key], {
      graph_data: [],
      max_price: 0,
      min_price: 0,
      percentage_change: "0",
    });

    console.log("Added graph slot for", key);
  }

  res.status(200).json("Init Cache!");
}
