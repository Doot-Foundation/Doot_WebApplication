/**
 * Normalizes price with proper decimal places
 * @param {boolean} subone - Determines decimal precision (true: 3 decimals, false: 2 decimals)
 * @param {string} str - Price string to normalize
 * @returns {number} Normalized price
 */
function normalizePrice(subone, str) {
  const num = parseInt(str) / Math.pow(10, 10);
  return (
    (subone ? Math.round(num * 1000) : Math.round(num * 100)) /
    (subone ? 1000 : 100)
  );
}

/**
 * Processes arrays of price data to generate graph information
 * @param {boolean} subone - Determines price normalization precision
 * @param {Array} latest - Most recent price data
 * @param {Array} historical_latest - Recent historical price data
 * @param {Array} historical_historical - Older historical price data
 * @returns {Array} [processedData, minPrice, maxPrice, percentageChange]
 */
async function generateGraphData(
  subone,
  latest,
  historical_latest,
  historical_historical
) {
  try {
    // Early validation
    if (!latest?.length) {
      throw new Error("Latest price data is required");
    }

    // Combine arrays efficiently with null checks
    const combinedArray = [
      ...(historical_historical || []),
      ...(historical_latest || []),
      ...latest,
    ];

    // Find min/max prices in a single pass
    const { minPrice, maxPrice } = combinedArray.reduce(
      (acc, item) => {
        if (item?.price !== undefined) {
          const price = normalizePrice(subone, item.price);
          return {
            minPrice: Math.min(acc.minPrice, price),
            maxPrice: Math.max(acc.maxPrice, price),
          };
        }
        return acc;
      },
      { minPrice: Infinity, maxPrice: -Infinity }
    );

    // Get first historical price, falling back through available data
    const firstHistoricalPrice = parseFloat(
      (historical_historical?.[0] || historical_latest?.[0] || latest[0]).price
    );

    // Calculate immediate price and percentage change
    const immediatePrice = parseFloat(latest[0].price);
    const percentageChange =
      ((immediatePrice - firstHistoricalPrice) / firstHistoricalPrice) * 100;
    const formattedPercentageChange = `${
      percentageChange >= 0 ? "+" : ""
    }${percentageChange.toFixed(2)}%`;

    // Process array items in parallel for performance
    const finalArray = await Promise.all(
      combinedArray.map((item) => ({
        timestamp: item.aggregationTimestamp,
        price: normalizePrice(subone, item.price),
      }))
    );

    console.log("Generated graph data.");
    return [finalArray, minPrice, maxPrice, formattedPercentageChange];
  } catch (error) {
    console.error(
      "Graph data generation failed:",
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = generateGraphData;
