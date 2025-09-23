const generateAggregationProof = require("@/utils/helper/GenerateAggregationProof");

const { redis } = require("@/utils/helper/init/InitRedis");
const {
  TOKEN_TO_CACHE,
  TOKEN_TO_AGGREGATION_PROOF_CACHE,
  TOKEN_TO_SYMBOL,
} = require("@/utils/constants/info");

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    let { token } = req.query;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json("Unauthorized");
    }

    if (token) {
      token = token.toLowerCase();

      if (!TOKEN_TO_SYMBOL[token])
        return res
          .status(400)
          .json({ status: 400, message: "ERR! Invalid token." });

      const proofCache = await redis.get(TOKEN_TO_AGGREGATION_PROOF_CACHE[token]);

      let isBase = true;
      if (proofCache && proofCache !== "NULL") {
        isBase = false;
      }

      let proofDefault = JSON.stringify({
        publicInput: [],
        publicOutput: [],
        maxProofsVerified: 0,
        proof: "",
      });

      console.log(`isBase: ${isBase}`);
      const cachedData = await redis.get(TOKEN_TO_CACHE[token]);

      if (!cachedData) {
        throw new Error(`No cached data found for token: ${token}`);
      }

      const priceInfo = cachedData.prices_returned;

      console.log(`\nProof creation for ${token} initialized.`);
      const aggregationResults = await generateAggregationProof(
        priceInfo,
        isBase ? proofDefault : JSON.stringify(proofCache),
        isBase
      );

      await redis.set(
        TOKEN_TO_AGGREGATION_PROOF_CACHE[token],
        JSON.stringify(aggregationResults[0])
      );
      console.log("Created successfully.\n");

      return res.status(200).json({
        message: "Created Proof Successfully!",
        data: {
          proof: aggregationResults[0],
          selfAggregationResult: cachedData.price,
          zkProgramAggregationResult: aggregationResults[1],
        },
        status: true,
        token: token,
      });
    } else
      return res
        .status(400)
        .json({ status: 400, message: "ERR! Query parameter missing(token)." });
  } catch (err) {
    console.error(`Error in handler: ${err.message}`);
    return res.status(400).json({
      message: `Proof Creation failed. ERR! : ${err.message}`,
      data: {},
      status: false,
      token: token,
    });
  }
}
