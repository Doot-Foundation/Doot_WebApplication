const {
  TOKEN_TO_CACHE,
  ORACLE_PUBLIC_KEY,
  SLOT_STATUS_CACHE,
} = require("../../../utils/constants/info");
const { redis } = require("../../../utils/helper/InitRedis");
const appendSignatureToSlot = require("../../../utils/helper/AppendSignatureToSlot");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json("Unauthorized");
    return;
  }

  const runLogic = await redis.get(SLOT_STATUS_CACHE);
  if (!runLogic) {
    console.log("In Locked State. Can't run.");
    res.status(200);
    return;
  }
  await redis.set(SLOT_STATUS_CACHE, false);

  const keys = Object.keys(TOKEN_TO_CACHE);
  for (const token of keys) {
    const cachedData = await redis.get(TOKEN_TO_CACHE[token]);

    await appendSignatureToSlot(
      token,
      cachedData,
      cachedData.signature,
      ORACLE_PUBLIC_KEY
    );

    console.log(token, "slot updated\n");
  }

  res.status(201).json({ status: "Updated All Slots Successfully." });
}
