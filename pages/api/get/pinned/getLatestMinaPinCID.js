const { redis } = require("../../../../utils/helper/init/InitRedis");
const { MINA_CID_CACHE } = require("../../../../utils/constants/info");

export default async function handler(req, res) {
  const data = await redis.get(MINA_CID_CACHE);
  return res.status(200).json({
    data: {
      cid: data[0],
      commitment: data[1],
    },
  });
}
