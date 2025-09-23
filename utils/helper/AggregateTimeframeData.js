/**
 * Pure data aggregation function for timeframe-based price chart intervals
 *
 * @description
 * This function takes raw 10-minute interval price data and aggregates it to larger timeframes
 * by selecting data points at specific intervals. This creates the standard trading chart behavior
 * where different timeframes show different granularities of the same dataset.
 *
 * @example
 * // Raw data: every 10 minutes
 * const rawData = [
 *   { timestamp: 1640995200, price: 100 }, // 12:00
 *   { timestamp: 1640995800, price: 101 }, // 12:10
 *   { timestamp: 1640996400, price: 102 }, // 12:20
 *   { timestamp: 1640997000, price: 103 }, // 12:30
 * ];
 *
 * // 30-minute aggregation (every 3rd point)
 * aggregateDataByTimeframe(rawData, 30)
 * // Returns: [
 * //   { timestamp: 1640995200, price: 100 }, // 12:00
 * //   { timestamp: 1640997000, price: 103 }, // 12:30
 * // ]
 */

/**
 * Core aggregation function - the mathematical heart of timeframe switching
 *
 * @param {Array} rawData - Array of {timestamp: number, price: number} objects
 * @param {number} intervalMinutes - Target interval in minutes (30, 60, 360, etc.)
 * @returns {Array} Aggregated data with same structure but fewer points
 */
function aggregateDataByTimeframe(rawData, intervalMinutes) {
  // Input validation - critical for stability
  if (!Array.isArray(rawData)) {
    console.warn('AggregateTimeframeData: rawData must be an array');
    return [];
  }

  if (rawData.length === 0) {
    return [];
  }

  if (!intervalMinutes || intervalMinutes <= 0) {
    console.warn('AggregateTimeframeData: intervalMinutes must be positive');
    return rawData; // Return original data if invalid interval
  }

  // Sort data by timestamp to ensure chronological order (defensive)
  const sortedData = [...rawData].sort((a, b) => {
    const tsA = Number(a.timestamp);
    const tsB = Number(b.timestamp);
    return tsA - tsB;
  });

  // Handle edge case: single data point
  if (sortedData.length === 1) {
    return sortedData;
  }

  // Calculate the interval step
  const BASE_INTERVAL_MINUTES = 10; // Our raw data is collected every 10 minutes
  const stepSize = Math.max(1, Math.round(intervalMinutes / BASE_INTERVAL_MINUTES));

  // For intervals smaller than base (e.g., requesting 5min when we have 10min data)
  if (intervalMinutes < BASE_INTERVAL_MINUTES) {
    console.warn(`AggregateTimeframeData: Requested interval ${intervalMinutes}min is smaller than base interval ${BASE_INTERVAL_MINUTES}min`);
    return sortedData; // Return all data
  }

  // Aggregate data by taking every Nth point
  const aggregatedData = [];

  // Always include the first data point
  aggregatedData.push(sortedData[0]);

  // Take every stepSize-th point
  for (let i = stepSize; i < sortedData.length; i += stepSize) {
    aggregatedData.push(sortedData[i]);
  }

  // Edge case: ensure we include the last data point if it's not already included
  // This ensures the chart always shows the most recent price
  const lastIndex = sortedData.length - 1;
  const lastIncludedIndex = aggregatedData.length > 1
    ? sortedData.indexOf(aggregatedData[aggregatedData.length - 1])
    : 0;

  if (lastIncludedIndex !== lastIndex && lastIndex > 0) {
    // Only add if it's significantly different from the last included point
    const timeDiffMinutes = (sortedData[lastIndex].timestamp - sortedData[lastIncludedIndex].timestamp) / 60;
    if (timeDiffMinutes >= BASE_INTERVAL_MINUTES) {
      aggregatedData.push(sortedData[lastIndex]);
    }
  }

  return aggregatedData;
}

/**
 * Helper function to calculate min/max for aggregated data
 * This ensures chart scaling works correctly with fewer data points
 *
 * @param {Array} aggregatedData - Output from aggregateDataByTimeframe
 * @returns {Object} {min: number, max: number}
 */
function calculateAggregatedMinMax(aggregatedData) {
  if (!Array.isArray(aggregatedData) || aggregatedData.length === 0) {
    return { min: 0, max: 0 };
  }

  const prices = aggregatedData.map(item => Number(item.price)).filter(price => !isNaN(price));

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Debug helper function for development
 * Logs aggregation statistics to help with testing and debugging
 *
 * @param {Array} originalData - Original dataset
 * @param {Array} aggregatedData - Aggregated dataset
 * @param {number} intervalMinutes - Interval used for aggregation
 */
function logAggregationStats(originalData, aggregatedData, intervalMinutes) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Timeframe Aggregation Stats:', {
      interval: `${intervalMinutes}min`,
      originalPoints: originalData.length,
      aggregatedPoints: aggregatedData.length,
      compressionRatio: `${((1 - aggregatedData.length / originalData.length) * 100).toFixed(1)}%`,
      timespan: originalData.length > 0 ? {
        start: new Date(originalData[0].timestamp * 1000).toISOString(),
        end: new Date(originalData[originalData.length - 1].timestamp * 1000).toISOString()
      } : null
    });
  }
}

// Export functions for use in components
module.exports = {
  aggregateDataByTimeframe,
  calculateAggregatedMinMax,
  logAggregationStats
};