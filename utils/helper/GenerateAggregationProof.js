const { AggregationModule } = require("./AggregationModule");
const { processFloatString } = require("./CallAndSignAPICalls");

async function generateProofCompatiblePrices(prices) {
  return prices.map((price) => BigInt(processFloatString(price.toString())));
}

async function generateAggregationProof(prices, lastProof, isBase) {
  const proofCompatiblePrices = await generateProofCompatiblePrices(prices);

  const aggregationResults = await AggregationModule(
    proofCompatiblePrices,
    lastProof,
    isBase
  );

  return aggregationResults;
}

module.exports = generateAggregationProof;
