// Sample array of prices
const prices = [
  100.0, 105.0, 98.0, 102.0, 120.0, 95.0, 125.0, 85.0, 130.0, 150.0,
];

// Function to calculate the median of an array
function calculateMedian(arr) {
  const sortedArr = arr.slice().sort((a, b) => a - b);
  const middle = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 === 0) {
    return (sortedArr[middle - 1] + sortedArr[middle]) / 2;
  }
  return sortedArr[middle];
}

// Function to calculate the median absolute deviation (MAD)
function calculateMAD(arr) {
  const median = calculateMedian(arr);
  const absoluteDeviations = arr.map((value) => Math.abs(value - median));
  return calculateMedian(absoluteDeviations);
}

// Function to calculate Modified Z-Scores and identify outliers
function identifyOutliers(prices, threshold) {
  const median = calculateMedian(prices);
  const MAD = calculateMAD(prices);

  const modifiedZScores = prices.map((price) => (price - median) / MAD);

  const outliers = modifiedZScores.reduce(
    (outliersArray, modifiedZScore, index) => {
      if (Math.abs(modifiedZScore) > threshold) {
        outliersArray.push({ price: prices[index], modifiedZScore });
      }
      return outliersArray;
    },
    []
  );

  return outliers;
}

// Set your desired Modified Z-Score threshold (e.g., ±3)
const modifiedZScoreThreshold = 3;

// Identify and print outliers
const outliers = identifyOutliers(prices, modifiedZScoreThreshold);
console.log("Outliers:");
console.log(outliers);
