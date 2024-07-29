function normalizePrice(subone, str) {
  let num = parseInt(str);
  num = num / Math.pow(10, 10);
  num = subone ? Math.round(num * 1000) / 1000 : Math.round(num * 100) / 100;
  return num;
}

async function generateGraphData(subone, immediate, latest, historical) {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  const combinedArray = [...historical, ...latest, ...immediate];

  combinedArray.forEach((item) => {
    if (item && item.price != undefined) {
      const price = normalizePrice(subone, item.price);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
  });

  const firstHistoricalPrice = parseFloat(historical[0].price);
  const immediatePrice = parseFloat(immediate[0].price);
  const percentageChange =
    ((immediatePrice - firstHistoricalPrice) / firstHistoricalPrice) * 100;
  const formattedPercentageChange =
    percentageChange >= 0
      ? `+${percentageChange.toFixed(2)}%`
      : `${percentageChange.toFixed(2)}%`;

  const finalArray = combinedArray.map((item) => ({
    timestamp: item.aggregationTimestamp,
    price: normalizePrice(subone, item.price),
  }));

  return [finalArray, minPrice, maxPrice, formattedPercentageChange];
}

module.exports = generateGraphData;
