function normalizePrice(subone, str) {
  let num = parseInt(str);
  num = num / Math.pow(10, 10);
  num = subone ? Math.round(num * 1000) / 1000 : Math.round(num * 100) / 100;
  return num;
}

async function generateGraphData(
  subone,
  latest,
  historical_latest,
  historical_historical
) {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  const combinedArray = [
    ...historical_historical,
    ...historical_latest,
    ...latest,
  ];

  combinedArray.forEach((item) => {
    if (item && item.price != undefined) {
      const price = normalizePrice(subone, item.price);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
  });

  /// THIS IS THE LAST VALUE IN THE HISTORICAL INFORMATION. IE THAT IS CLOSEST TO 24 HOURS IN THE PAST.
  /// IF NOT AVAILABLE, USE THE LATEST PRICE.
  let firstHistoricalPrice;
  if (historical_historical[0])
    firstHistoricalPrice = parseFloat(historical_historical[0].price);
  else if (historical_latest[0])
    firstHistoricalPrice = parseFloat(historical_latest[0].price);
  else firstHistoricalPrice = parseFloat(latest[0].price);

  const immediatePrice = parseFloat(latest[0].price);

  /// % OF CHANGE IN THE PAST 24 HOURS = DIFF IN THE LATEST VALUE AND THE OLDEST VALUE IN TERMS OF TIMESTAMP.
  const percentageChange =
    ((immediatePrice - firstHistoricalPrice) / firstHistoricalPrice) * 100;
  /// CHANGE IS NET POSITIVE OR NET NEGATIVE.
  const formattedPercentageChange =
    percentageChange >= 0
      ? `+${percentageChange.toFixed(2)}%`
      : `${percentageChange.toFixed(2)}%`;

  const finalArray = combinedArray.map((item) => ({
    timestamp: item.aggregationTimestamp,
    price: normalizePrice(subone, item.price),
  }));

  console.log("Generated graph data.");
  return [finalArray, minPrice, maxPrice, formattedPercentageChange];
}

module.exports = generateGraphData;
