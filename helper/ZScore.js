// Sample array of prices
const prices = [
  100.0, 105.0, 98.0, 102.0, 120.0, 95.0, 125.0, 85.0, 130.0, 150.0,
];

// Function to calculate the mean of an array
function calculateMean(arr) {
  const sum = arr.reduce((acc, value) => acc + value, 0);
  return sum / arr.length;
}

// Function to calculate the standard deviation of an array
function calculateStandardDeviation(arr) {
  const mean = calculateMean(arr);
  const squaredDifferences = arr.map((value) => Math.pow(value - mean, 2));
  const variance =
    squaredDifferences.reduce((acc, value) => acc + value, 0) / arr.length;
  return Math.sqrt(variance);
}

// Function to calculate Z-Scores and identify outliers
function identifyOutliers(prices, threshold) {
  const mean = calculateMean(prices);
  const standardDeviation = calculateStandardDeviation(prices);

  const zScores = prices.map((price) => (price - mean) / standardDeviation);

  const outliers = zScores.reduce((outliersArray, zScore, index) => {
    if (Math.abs(zScore) > threshold) {
      outliersArray.push({ price: prices[index], zScore });
    }
    return outliersArray;
  }, []);

  return outliers;
}

// Set your desired Z-Score threshold (e.g., ±2 standard deviations)
const zScoreThreshold = 2;

// Identify and print outliers
const outliers = identifyOutliers(prices, zScoreThreshold);
console.log("Outliers:");
console.log(outliers);
