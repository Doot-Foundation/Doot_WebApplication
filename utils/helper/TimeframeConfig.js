/**
 * Timeframe Configuration System
 *
 * @description
 * This module provides the mapping between UI timeframe buttons and aggregation intervals.
 * It serves as the central configuration for how different timeframes should aggregate
 * the raw 10-minute price data into appropriate chart granularities.
 *
 * @important
 * This configuration must stay in sync with the timeframe buttons defined in:
 * - IndividualAsset.js lines 246 (mobile) and 273-286 (desktop)
 */

/**
 * Core timeframe to interval mapping
 * Maps UI timeframe strings to aggregation intervals in minutes
 *
 * @note All intervals are based on our 10-minute base collection interval
 */
const TIMEFRAME_INTERVALS = {
  // Short-term timeframes (minutes/hours)
  '10min': 10,   // No aggregation - show all data points
  '30min': 30,   // Every 3rd point (30 ÷ 10 = 3)
  '1h': 60,      // Every 6th point (60 ÷ 10 = 6)
  '3h': 180,     // Every 18th point (180 ÷ 10 = 18)
  '6h': 360,     // Every 36th point (360 ÷ 10 = 36)
  '12h': 720,    // Every 72nd point (720 ÷ 10 = 72)
  '24h': 1440,   // Every 144th point (1440 ÷ 10 = 144) - daily

  // Long-term timeframes (days/months)
  '7d': 10080,   // Every 1008th point (7 days * 1440 min/day ÷ 10 = 1008) - weekly
  '15d': 21600,  // Every 2160th point (15 days * 1440 min/day ÷ 10 = 2160)
  '1m': 43200,   // Every 4320th point (30 days * 1440 min/day ÷ 10 = 4320) - monthly
  '3m': 129600,  // Every 12960th point (90 days * 1440 min/day ÷ 10 = 12960) - quarterly
  '6m': 259200,  // Every 25920th point (180 days * 1440 min/day ÷ 10 = 25920) - semi-annual

  // Special case
  'all': null    // No aggregation - show all available data points
};

/**
 * Available timeframes for different screen sizes
 * These arrays must match the UI button definitions exactly
 */
const MOBILE_TIMEFRAMES = ['10min', '1h', '12h', '24h', '1m'];
const DESKTOP_TIMEFRAMES = ['10min', '30min', '1h', '3h', '6h', '12h', '24h', '7d', '15d', '1m', '3m', '6m', 'all'];

/**
 * Get aggregation interval for a timeframe
 *
 * @param {string} timeframe - Timeframe string from UI (e.g., '30min', '1h')
 * @returns {number|null} Interval in minutes, or null for 'all'/no aggregation
 */
function getIntervalForTimeframe(timeframe) {
  if (!timeframe || typeof timeframe !== 'string') {
    console.warn('TimeframeConfig: Invalid timeframe provided, defaulting to 10min');
    return TIMEFRAME_INTERVALS['10min'];
  }

  const interval = TIMEFRAME_INTERVALS[timeframe];

  if (interval === undefined) {
    console.warn(`TimeframeConfig: Unknown timeframe '${timeframe}', defaulting to 10min`);
    return TIMEFRAME_INTERVALS['10min'];
  }

  return interval; // Can be null for 'all'
}

/**
 * Check if a timeframe requires aggregation
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {boolean} True if aggregation is needed, false for raw data
 */
function requiresAggregation(timeframe) {
  const interval = getIntervalForTimeframe(timeframe);
  return interval !== null && interval > 10; // Anything larger than base 10min interval
}

/**
 * Get human-readable description of timeframe aggregation
 * Useful for debugging and development
 *
 * @param {string} timeframe - Timeframe string from UI
 * @returns {string} Human-readable description
 */
function getTimeframeDescription(timeframe) {
  const interval = getIntervalForTimeframe(timeframe);

  if (interval === null) {
    return 'All available data (no aggregation)';
  }

  if (interval === 10) {
    return 'Raw 10-minute data (no aggregation)';
  }

  const ratio = interval / 10;
  return `Every ${ratio} data points (${interval} minute intervals)`;
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
 * Development helper: Log all timeframe configurations
 * Useful for debugging and verification
 */
function logTimeframeConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📅 Timeframe Configuration:');
    console.log('Mobile timeframes:', MOBILE_TIMEFRAMES);
    console.log('Desktop timeframes:', DESKTOP_TIMEFRAMES);
    console.log('\nInterval mappings:');

    Object.entries(TIMEFRAME_INTERVALS).forEach(([timeframe, interval]) => {
      console.log(`  ${timeframe.padEnd(6)} → ${interval === null ? 'no aggregation' : interval + ' minutes'}`);
    });
  }
}

// Export all functions for use in components
module.exports = {
  // Core functions
  getIntervalForTimeframe,
  requiresAggregation,

  // Validation functions
  isValidTimeframe,
  getDefaultTimeframe,

  // Utility functions
  getTimeframeDescription,
  logTimeframeConfig,

  // Constants for direct access if needed
  TIMEFRAME_INTERVALS,
  MOBILE_TIMEFRAMES,
  DESKTOP_TIMEFRAMES
};