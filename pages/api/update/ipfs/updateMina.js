const { redis } = require("@/utils/helper/init/InitRedis.js");

const {
  MINA_CID_CACHE,
  MINA_MAX_SIGNED_SLOT_CACHE,
} = require("@/utils/constants/info.js");
const pinMinaObject = require("@/utils/helper/PinMinaObject.ts");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json("Unauthorized");
  }

  const obj = {};
  const finalSlotState = {};

  const CACHED_DATA = await redis.get(MINA_MAX_SIGNED_SLOT_CACHE);
  const keys = Object.keys(CACHED_DATA);

  for (const key of keys) {
    const data = CACHED_DATA[key];
    obj[key] = data;
    finalSlotState[key] = { community: {} };
  }
  //RESULTS : [IPFSHASH,COMMITMENT]
  const [cid, commitment] = await redis.get(MINA_CID_CACHE);
  const results = await pinMinaObject(toPin, cid);

  // IPFS PIN UPDATED.
  await redis.set(MINA_CID_CACHE, results);
  // RESET THE MAX SLOT AFTER THE HISTORICAL HAS BEEN UPDATED.
  await redis.set(MINA_MAX_SIGNED_SLOT_CACHE, finalSlotState);

  return res.status(200).json({
    status: true,
    message: "Updated Mina L1 IPFS data successfully.",
    data: {
      cid: results[0],
      merkle_map_commitment: results[1],
    },
  });
}
