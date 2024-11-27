const { AggregationModule } = require("@/utils/helper/AggregationModule");
const { processFloatString } = require("@/utils/helper/CallAndSignAPICalls");

/**
 * Convert prices array to array of BigInt values in parallel
 */
async function generateProofCompatiblePrices(prices) {
  return Promise.all(
    prices.map((price) =>
      Promise.resolve(processFloatString(price.toString())).then(BigInt)
    )
  );
}

/**
 * Generate aggregation proof with proper error handling
 */
async function generateAggregationProof(prices, lastProof, isBase) {
  try {
    const proofCompatiblePrices = await generateProofCompatiblePrices(prices);
    return await AggregationModule(proofCompatiblePrices, lastProof, isBase);
  } catch (error) {
    console.error("Proof generation failed:", error.message || "Unknown error");
    throw error;
  }
}

module.exports = generateAggregationProof;
