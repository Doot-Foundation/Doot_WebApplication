/**
 * Time Window Filtering System for Price Charts
 *
 * @description
 * This module provides time-window based filtering for price chart data.
 * Instead of mathematical point selection, it filters data based on time windows
 * from the latest data point backwards. This creates the proper trading chart behavior
 * where timeframes show recent data within that specific time period.
 *
 * @example
 * // Raw data spanning several hours
 * const rawData = [
 *   { timestamp: 1640995200, price: 100 }, // 2 hours ago
 *   { timestamp: 1640998800, price: 101 }, // 1 hour ago
 *   { timestamp: 1641002400, price: 102 }, // 30 min ago
 *   { timestamp: 1641004200, price: 103 }, // Latest (now)
 * ];
 *
 * // 1-hour window filtering
 * filterDataByTimeWindow(rawData, '1h')
 * // Returns: [
 * //   { timestamp: 1640998800, price: 101 }, // 1 hour ago
 * //   { timestamp: 1641002400, price: 102 }, // 30 min ago
 * //   { timestamp: 1641004200, price: 103 }, // Latest
 * // ]
 */

/**
 * Fixed data point counts for short timeframes
 * Based on 10-minute update intervals from vercel.json cron schedule:
 * - updateAllPrices: every 10 minutes
 * - updateHistorical: every 10 minutes starting at minute 5
 */
const FIXED_DATA_POINTS = {
  '10min': 2,   // 1 interval + buffer → 2 points (10 min window)
  '30min': 4,   // 3 intervals + buffer → 4 points (30 min window)
  '1h': 7,      // 6 intervals + buffer → 7 points (1 hour window)
  '3h': 19,     // 18 intervals + buffer → 19 points (3 hour window)
  '6h': 37,     // 36 intervals + buffer → 37 points (6 hour window)
  '12h': 73,    // 72 intervals + buffer → 73 points (12 hour window)
  '24h': 145,   // 144 intervals + buffer → 145 points (24 hour window)
};

/**
 * Time window definitions in milliseconds (for longer timeframes)
 * Maps UI timeframe strings to time durations from latest data point
 */
const TIMEFRAME_WINDOWS = {
  // Short-term timeframes use FIXED_DATA_POINTS instead
  '10min': 10 * 60 * 1000,        // 10 minutes
  '30min': 30 * 60 * 1000,        // 30 minutes
  '1h': 60 * 60 * 1000,           // 1 hour
  '3h': 3 * 60 * 60 * 1000,       // 3 hours
  '6h': 6 * 60 * 60 * 1000,       // 6 hours
  '12h': 12 * 60 * 60 * 1000,     // 12 hours
  '24h': 24 * 60 * 60 * 1000,     // 24 hours (1 day)

  // Long-term timeframes (use time window filtering)
  '7d': 7 * 24 * 60 * 60 * 1000,   // 7 days (1 week)
  '15d': 15 * 24 * 60 * 60 * 1000, // 15 days
  '1m': 30 * 24 * 60 * 60 * 1000,  // 30 days (1 month)
  '3m': 90 * 24 * 60 * 60 * 1000,  // 90 days (3 months)
  '6m': 180 * 24 * 60 * 60 * 1000, // 180 days (6 months)

  // Special case
  'all': null // Show all available data points
};

/**
 * Available timeframes for different screen sizes
 * These arrays must match the UI button definitions exactly
 */
const MOBILE_TIMEFRAMES = ['10min', '1h', '12h', '24h', '1m'];
const DESKTOP_TIMEFRAMES = ['10min', '30min', '1h', '3h', '6h', '12h', '24h', '7d', '15d', '1m', '3m', '6m', 'all'];

/**
 * Check if a timeframe uses fixed data point count
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {boolean} True if uses fixed points, false if uses time window
 */
function usesFixedDataPoints(timeframe) {
  return FIXED_DATA_POINTS.hasOwnProperty(timeframe);
}

/**
 * Get fixed data point count for a timeframe
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {number|null} Fixed point count, or null if uses time window
 */
function getFixedDataPointCount(timeframe) {
  return FIXED_DATA_POINTS[timeframe] || null;
}

/**
 * Core filtering function with fixed data points for short timeframes and time windows for long ones
 *
 * @param {Array} rawData - Array of {timestamp: number, price: number} objects
 * @param {string} timeframe - Timeframe string from UI (e.g., '30min', '1h')
 * @param {number} slideOffset - Number of steps to slide the window (0 = latest, 1 = one step back, etc.)
 * @returns {Array} Filtered data within the time window or fixed point count
 */
function filterDataByTimeWindow(rawData, timeframe, slideOffset = 0) {
  // Input validation - critical for stability
  if (!Array.isArray(rawData)) {
    console.warn('TimeWindowFilter: rawData must be an array');
    return [];
  }

  if (rawData.length === 0) {
    return [];
  }

  if (!timeframe || typeof timeframe !== 'string') {
    console.warn('TimeWindowFilter: Invalid timeframe provided, defaulting to 24h');
    timeframe = '24h';
  }

  // Sort data by timestamp to ensure chronological order (defensive)
  const sortedData = [...rawData].sort((a, b) => {
    const tsA = convertTimestampToMs(a.timestamp);
    const tsB = convertTimestampToMs(b.timestamp);
    return tsA - tsB;
  });

  // Handle edge case: single data point
  if (sortedData.length === 1) {
    return sortedData;
  }

  // Handle 'all' timeframe - return all data
  if (timeframe === 'all') {
    return sortedData;
  }

  // Check if this timeframe uses fixed data points
  if (usesFixedDataPoints(timeframe)) {
    return filterByFixedDataPoints(sortedData, timeframe, slideOffset);
  } else {
    return filterByTimeWindow(sortedData, timeframe, slideOffset);
  }
}

/**
 * Filter data using fixed data point counts (for short timeframes)
 * This ensures consistent chart appearance regardless of actual timing
 * Uses smart slide steps for different timeframe sizes
 *
 * @param {Array} sortedData - Pre-sorted data array
 * @param {string} timeframe - Timeframe string
 * @param {number} slideOffset - Slide offset for navigation
 * @returns {Array} Fixed number of data points
 */
function filterByFixedDataPoints(sortedData, timeframe, slideOffset) {
  const fixedCount = getFixedDataPointCount(timeframe);
  const slideStep = getFixedDataPointSlideStep(timeframe);

  if (!fixedCount || sortedData.length < fixedCount) {
    // If not enough data, return all available data
    return sortedData;
  }

  // Calculate the starting index based on slide offset and step size
  // slideOffset = 0 means latest data (start from end)
  // slideOffset = 1 means slide back by slideStep data points
  const totalSlideDistance = slideOffset * slideStep;
  const startIndex = Math.max(0, sortedData.length - fixedCount - totalSlideDistance);
  const endIndex = startIndex + fixedCount;

  return sortedData.slice(startIndex, endIndex);
}

/**
 * Filter data using time window approach (for long timeframes)
 *
 * @param {Array} sortedData - Pre-sorted data array
 * @param {string} timeframe - Timeframe string
 * @param {number} slideOffset - Slide offset for navigation
 * @returns {Array} Time-filtered data points
 */
function filterByTimeWindow(sortedData, timeframe, slideOffset) {
  const timeWindowMs = TIMEFRAME_WINDOWS[timeframe];

  if (timeWindowMs === undefined) {
    console.warn(`TimeWindowFilter: Unknown timeframe '${timeframe}', defaulting to 24h`);
    return filterByTimeWindow(sortedData, '24h', slideOffset);
  }

  // Calculate reference timestamp based on slide offset and smart step size
  const slideStepMs = getSlideStepSize(timeframe);
  const latestTimestamp = convertTimestampToMs(sortedData[sortedData.length - 1].timestamp);
  const referenceTimestamp = latestTimestamp - (slideOffset * slideStepMs);

  // Calculate cutoff timestamp (reference timestamp - time window)
  const cutoffTimestamp = referenceTimestamp - timeWindowMs;

  // Filter data points within the sliding time window
  const filteredData = sortedData.filter(item => {
    const itemTimestamp = convertTimestampToMs(item.timestamp);
    return itemTimestamp >= cutoffTimestamp && itemTimestamp <= referenceTimestamp;
  });

  // Ensure we always have at least one data point
  if (filteredData.length === 0 && sortedData.length > 0) {
    // If no data within window, return the latest data point
    return [sortedData[sortedData.length - 1]];
  }

  return filteredData;
}

/**
 * Helper function to convert timestamp to milliseconds
 * Handles both Unix seconds and milliseconds automatically
 *
 * @param {number} timestamp - Timestamp in seconds or milliseconds
 * @returns {number} Timestamp in milliseconds
 */
function convertTimestampToMs(timestamp) {
  const ts = Number(timestamp);
  // If timestamp is in seconds (< year 2100), convert to milliseconds
  return ts < 4000000000 ? ts * 1000 : ts;
}

/**
 * Calculate price difference between oldest and newest point in filtered data
 * Used for displaying price change in the timeframe
 *
 * @param {Array} filteredData - Filtered data from filterDataByTimeWindow
 * @returns {Object} {oldestPrice: number, latestPrice: number, difference: number, percentChange: number}
 */
function calculatePriceDifference(filteredData) {
  if (!Array.isArray(filteredData) || filteredData.length === 0) {
    return {
      oldestPrice: 0,
      latestPrice: 0,
      difference: 0,
      percentChange: 0
    };
  }

  // For single data point, no change
  if (filteredData.length === 1) {
    const price = Number(filteredData[0].price);
    return {
      oldestPrice: price,
      latestPrice: price,
      difference: 0,
      percentChange: 0
    };
  }

  // Data is already sorted by timestamp from filterDataByTimeWindow
  const oldestPoint = filteredData[0];
  const latestPoint = filteredData[filteredData.length - 1];

  const oldestPrice = Number(oldestPoint.price);
  const latestPrice = Number(latestPoint.price);
  const difference = latestPrice - oldestPrice;
  const percentChange = oldestPrice !== 0 ? (difference / oldestPrice) * 100 : 0;

  return {
    oldestPrice,
    latestPrice,
    difference,
    percentChange
  };
}

/**
 * Format price difference for display with appropriate prefix and color
 *
 * @param {number} difference - Price difference (positive or negative)
 * @param {number} percentChange - Percentage change
 * @returns {Object} {formattedDifference: string, color: string, isPositive: boolean}
 */
function formatPriceDifference(difference, percentChange) {
  const isPositive = difference >= 0;
  const prefix = isPositive ? '+' : '';

  // Format difference with appropriate decimals
  let formattedDiff;
  if (Math.abs(difference) >= 1000000) {
    formattedDiff = (difference / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(difference) >= 1000) {
    formattedDiff = (difference / 1000).toFixed(2) + 'K';
  } else if (Math.abs(difference) < 1) {
    formattedDiff = difference.toFixed(4);
  } else {
    formattedDiff = difference.toFixed(2);
  }

  // Format percentage
  const formattedPercent = Math.abs(percentChange).toFixed(2);

  return {
    formattedDifference: `${prefix}$${formattedDiff}`,
    formattedPercent: `${prefix}${formattedPercent}%`,
    color: isPositive ? '#48BB78' : '#F56565', // Green for positive, red for negative
    isPositive
  };
}

/**
 * Helper function to calculate min/max for filtered data
 * This ensures chart scaling works correctly with time-filtered data
 *
 * @param {Array} filteredData - Output from filterDataByTimeWindow
 * @returns {Object} {min: number, max: number}
 */
function calculateTimeWindowMinMax(filteredData) {
  if (!Array.isArray(filteredData) || filteredData.length === 0) {
    return { min: 0, max: 0 };
  }

  const prices = filteredData.map(item => Number(item.price)).filter(price => !isNaN(price));

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Get time window duration for a timeframe
 *
 * @param {string} timeframe - Timeframe string from UI (e.g., '30min', '1h')
 * @returns {number|null} Time window in milliseconds, or null for 'all'
 */
function getTimeWindowForTimeframe(timeframe) {
  if (!timeframe || typeof timeframe !== 'string') {
    console.warn('TimeWindowFilter: Invalid timeframe provided, defaulting to 24h');
    return TIMEFRAME_WINDOWS['24h'];
  }

  const timeWindow = TIMEFRAME_WINDOWS[timeframe];

  if (timeWindow === undefined) {
    console.warn(`TimeWindowFilter: Unknown timeframe '${timeframe}', defaulting to 24h`);
    return TIMEFRAME_WINDOWS['24h'];
  }

  return timeWindow; // Can be null for 'all'
}

/**
 * Check if a timeframe shows all data
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {boolean} True if timeframe shows all data, false for time window
 */
function isShowAllTimeframe(timeframe) {
  return timeframe === 'all' || getTimeWindowForTimeframe(timeframe) === null;
}

/**
 * Get human-readable description of timeframe filtering
 * Useful for debugging and development
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {string} Human-readable description
 */
function getTimeframeDescription(timeframe) {
  const timeWindow = getTimeWindowForTimeframe(timeframe);

  if (timeWindow === null) {
    return 'All available data (no time filtering)';
  }

  const hours = timeWindow / (60 * 60 * 1000);
  const days = timeWindow / (24 * 60 * 60 * 1000);

  if (timeWindow < 60 * 60 * 1000) {
    const minutes = timeWindow / (60 * 1000);
    return `Last ${minutes} minutes from latest data point`;
  } else if (timeWindow < 24 * 60 * 60 * 1000) {
    return `Last ${hours} hour(s) from latest data point`;
  } else {
    return `Last ${days} day(s) from latest data point`;
  }
}

/**
 * Validate timeframe exists in UI configuration
 * Helps catch configuration mismatches during development
 *
 * @param {string} timeframe - Timeframe to validate
 * @param {boolean} isMobile - Whether to check against mobile or desktop config
 * @returns {boolean} True if timeframe is valid for the platform
 */
function isValidTimeframe(timeframe, isMobile = false) {
  const validTimeframes = isMobile ? MOBILE_TIMEFRAMES : DESKTOP_TIMEFRAMES;
  return validTimeframes.includes(timeframe);
}

/**
 * Get default timeframe for the platform
 *
 * @param {boolean} isMobile - Whether to get mobile or desktop default
 * @returns {string} Default timeframe string
 */
function getDefaultTimeframe(isMobile = false) {
  // Default to 24h for both platforms (matches current UI default)
  return '24h';
}

/**
 * Get slide step size for a timeframe (smart sliding strategy)
 * Different logic for fixed data points vs time windows
 *
 * @param {string} timeframe - Timeframe string
 * @returns {number} Step size (data points for fixed, milliseconds for time windows)
 */
function getSlideStepSize(timeframe) {
  // For fixed data point timeframes, return data point step sizes
  if (usesFixedDataPoints(timeframe)) {
    return getFixedDataPointSlideStep(timeframe);
  }

  // For time window timeframes, return millisecond step sizes
  const timeWindowMs = getTimeWindowForTimeframe(timeframe);

  if (timeWindowMs === null) {
    return 0; // No sliding for 'all' timeframe
  }

  // For large timeframes (≥1h): Half-window steps for meaningful navigation
  return Math.floor(timeWindowMs / 2);
}

/**
 * Get slide step size in data points for fixed data point timeframes
 * Small timeframes: 1 data point steps
 * Large timeframes: Bigger jumps for meaningful navigation
 *
 * @param {string} timeframe - Timeframe string
 * @returns {number} Step size in data points
 */
function getFixedDataPointSlideStep(timeframe) {
  const stepSizes = {
    '10min': 1,   // Single point precision
    '30min': 1,   // Single point precision
    '1h': 6,      // ~1 hour jumps (6 * 10min = 1hr)
    '3h': 18,     // ~3 hour jumps (18 * 10min = 3hr)
    '6h': 36,     // ~6 hour jumps (36 * 10min = 6hr)
    '12h': 72,    // ~12 hour jumps (72 * 10min = 12hr)
    '24h': 144,   // ~24 hour jumps (144 * 10min = 24hr)
  };

  return stepSizes[timeframe] || 1;
}

/**
 * Calculate maximum slide offset for a timeframe
 * Uses different logic for fixed data points vs time windows
 *
 * @param {Array} rawData - Original dataset
 * @param {string} timeframe - Timeframe string
 * @returns {number} Maximum slide offset (0-based)
 */
function getMaxSlideOffset(rawData, timeframe) {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return 0;
  }

  if (timeframe === 'all') {
    return 0; // No sliding for 'all' timeframe
  }

  // For fixed data point timeframes
  if (usesFixedDataPoints(timeframe)) {
    const fixedCount = getFixedDataPointCount(timeframe);
    const slideStep = getFixedDataPointSlideStep(timeframe);

    if (!fixedCount || rawData.length < fixedCount) {
      return 0; // Not enough data for sliding
    }

    // Calculate how many slide steps we can take
    const availableSlideDistance = rawData.length - fixedCount;
    return Math.floor(availableSlideDistance / slideStep);
  }

  // For time window timeframes (long timeframes)
  const timeWindowMs = getTimeWindowForTimeframe(timeframe);
  const slideStepMs = getSlideStepSize(timeframe);

  if (timeWindowMs === null || slideStepMs === 0) {
    return 0;
  }

  // Sort data by timestamp
  const sortedData = [...rawData].sort((a, b) => {
    const tsA = convertTimestampToMs(a.timestamp);
    const tsB = convertTimestampToMs(b.timestamp);
    return tsA - tsB;
  });

  const oldestTimestamp = convertTimestampToMs(sortedData[0].timestamp);
  const latestTimestamp = convertTimestampToMs(sortedData[sortedData.length - 1].timestamp);
  const totalTimespan = latestTimestamp - oldestTimestamp;

  // Calculate how many slide steps fit in the available timespan
  const maxSlides = Math.floor((totalTimespan - timeWindowMs) / slideStepMs);

  // Ensure we don't slide beyond available data
  return Math.max(0, maxSlides);
}

/**
 * Get sliding window navigation info for UI controls
 *
 * @param {Array} rawData - Original dataset
 * @param {string} timeframe - Timeframe string
 * @param {number} currentSlideOffset - Current slide position
 * @returns {Object} {canSlideLeft: boolean, canSlideRight: boolean, maxOffset: number, currentOffset: number}
 */
function getSlideNavigationInfo(rawData, timeframe, currentSlideOffset) {
  const maxOffset = getMaxSlideOffset(rawData, timeframe);
  const currentOffset = Math.max(0, Math.min(currentSlideOffset, maxOffset));

  return {
    canSlideLeft: currentOffset < maxOffset,  // Can go further back in time
    canSlideRight: currentOffset > 0,        // Can go forward towards present
    maxOffset,
    currentOffset,
    isAtPresent: currentOffset === 0,
    isAtOldest: currentOffset === maxOffset
  };
}

/**
 * Debug helper function for development
 * Logs time window filtering statistics to help with testing and debugging
 *
 * @param {Array} originalData - Original dataset
 * @param {Array} filteredData - Filtered dataset
 * @param {string} timeframe - Timeframe used for filtering
 * @param {number} slideOffset - Current slide offset
 */
function logTimeWindowStats(originalData, filteredData, timeframe, slideOffset = 0) {
  if (process.env.NODE_ENV === 'development') {
    const timeWindow = getTimeWindowForTimeframe(timeframe);
    const priceDiff = calculatePriceDifference(filteredData);

    const slideStepMs = getSlideStepSize(timeframe);
    const latestInOriginal = originalData.length > 0 ? new Date(convertTimestampToMs(originalData[originalData.length - 1].timestamp)).toISOString() : 'N/A';
    const latestInFiltered = filteredData.length > 0 ? new Date(convertTimestampToMs(filteredData[filteredData.length - 1].timestamp)).toISOString() : 'N/A';

    console.log('⏰ Sliding Window Stats:', {
      timeframe: timeframe,
      timeWindow: timeWindow ? `${timeWindow / 60000}min` : 'all data',
      slideOffset: slideOffset,
      slideStepSize: slideStepMs ? `${slideStepMs / 60000}min` : 'N/A',
      originalPoints: originalData.length,
      filteredPoints: filteredData.length,
      retentionRatio: `${((filteredData.length / originalData.length) * 100).toFixed(1)}%`,
      timespan: filteredData.length > 0 ? {
        start: new Date(convertTimestampToMs(filteredData[0].timestamp)).toISOString(),
        end: latestInFiltered
      } : null,
      comparison: {
        originalLatest: latestInOriginal,
        filteredLatest: latestInFiltered,
        droppedRecentData: latestInOriginal !== latestInFiltered
      },
      priceChange: {
        difference: priceDiff.difference.toFixed(4),
        percent: priceDiff.percentChange.toFixed(2) + '%'
      }
    });
  }
}

/**
 * Development helper: Log all timeframe configurations
 * Useful for debugging and verification
 */
function logTimeframeConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.log('⏰ Time Window Configuration:');
    console.log('Mobile timeframes:', MOBILE_TIMEFRAMES);
    console.log('Desktop timeframes:', DESKTOP_TIMEFRAMES);
    console.log('\nTime window mappings:');

    Object.entries(TIMEFRAME_WINDOWS).forEach(([timeframe, timeWindow]) => {
      if (timeWindow === null) {
        console.log(`  ${timeframe.padEnd(6)} → all data`);
      } else {
        const hours = timeWindow / (60 * 60 * 1000);
        const days = timeWindow / (24 * 60 * 60 * 1000);

        if (timeWindow < 60 * 60 * 1000) {
          const minutes = timeWindow / (60 * 1000);
          console.log(`  ${timeframe.padEnd(6)} → ${minutes} minutes`);
        } else if (timeWindow < 24 * 60 * 60 * 1000) {
          console.log(`  ${timeframe.padEnd(6)} → ${hours} hours`);
        } else {
          console.log(`  ${timeframe.padEnd(6)} → ${days} days`);
        }
      }
    });
  }
}

// Export all functions for use in components
module.exports = {
  // Core functions
  filterDataByTimeWindow,
  calculatePriceDifference,
  formatPriceDifference,
  calculateTimeWindowMinMax,

  // Sliding window functions
  getSlideStepSize,
  getMaxSlideOffset,
  getSlideNavigationInfo,

  // Configuration functions
  getTimeWindowForTimeframe,
  isShowAllTimeframe,

  // Validation functions
  isValidTimeframe,
  getDefaultTimeframe,

  // Utility functions
  getTimeframeDescription,
  logTimeWindowStats,
  logTimeframeConfig,
  convertTimestampToMs,

  // Fixed data point functions
  usesFixedDataPoints,
  getFixedDataPointCount,
  getFixedDataPointSlideStep,
  filterByFixedDataPoints,
  filterByTimeWindow,

  // Constants for direct access if needed
  TIMEFRAME_WINDOWS,
  MOBILE_TIMEFRAMES,
  DESKTOP_TIMEFRAMES,
  FIXED_DATA_POINTS
};