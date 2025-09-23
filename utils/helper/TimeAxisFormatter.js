/**
 * Timezone-Aware Time Axis Formatter for Price Charts
 *
 * @description
 * Handles the complex timezone conversion from US-East backend timestamps
 * to user's local timezone, following industry patterns for chart time labels.
 *
 * Key Context:
 * - Backend runs in US-East timezone and collects data timestamps there
 * - Frontend needs to display times in user's local timezone
 * - Timestamps from API are in Unix seconds format
 * - Must handle timezone conversions properly for global users
 */

/**
 * Timeframe-specific label patterns following user requirements
 * Short timeframes get hour:minute with MORE labels
 * Medium timeframes get date + hour
 * Large timeframes get day + month
 */
const TIMEFRAME_TO_FORMAT = {
  // Short timeframes: Hour:Minute format with high label density (10min gets +2 more than 30min)
  '10min': { format: { hour: '2-digit', minute: '2-digit', hour12: false }, maxLabels: 14 },
  '30min': { format: { hour: '2-digit', minute: '2-digit', hour12: false }, maxLabels: 12 },
  '1h': { format: { hour: '2-digit', minute: '2-digit', hour12: false }, maxLabels: 8 },
  '3h': { format: { hour: '2-digit', minute: '2-digit', hour12: false }, maxLabels: 8 },
  '6h': { format: { hour: '2-digit', minute: '2-digit', hour12: false }, maxLabels: 6 },

  // Medium timeframes: Clean "Day/Month Hour:Min" format (numeric month)
  '12h': { format: 'dayNumericMonthTime', maxLabels: 6 },
  '24h': { format: 'dayNumericMonthTime', maxLabels: 6 },

  // Large timeframes: Day/Month format (numeric month)
  '7d': { format: 'dayNumericMonth', maxLabels: 8 },
  '15d': { format: 'dayNumericMonth', maxLabels: 8 },
  '1m': { format: 'dayNumericMonth', maxLabels: 10 },
  '3m': { format: { month: '2-digit', year: 'numeric' }, maxLabels: 6 },
  '6m': { format: { month: '2-digit', year: 'numeric' }, maxLabels: 6 },
  'all': { format: { month: '2-digit', year: 'numeric' }, maxLabels: 8 }
};

/**
 * Convert timestamp to user's local Date object
 * Handles both millisecond and second timestamps automatically
 *
 * @param {number} timestamp - Timestamp from backend (auto-detects format)
 * @returns {Date} Date object in user's local timezone
 */
function convertBackendTimestampToLocal(timestamp) {
  // Auto-detect timestamp format: if > 1e12, it's milliseconds; else seconds
  const isMilliseconds = timestamp > 1e12;
  return new Date(isMilliseconds ? timestamp : timestamp * 1000);
}

/**
 * Get format pattern for a specific timeframe
 * Returns appropriate format and max labels based on timeframe
 *
 * @param {string} timeframe - Timeframe string (e.g., '10min', '1h', '24h')
 * @returns {Object} Format pattern with maxLabels and format options
 */
function getTimeframePattern(timeframe) {
  const pattern = TIMEFRAME_TO_FORMAT[timeframe];
  if (!pattern) {
    console.warn(`TimeAxisFormatter: Unknown timeframe '${timeframe}', defaulting to '1h'`);
    return TIMEFRAME_TO_FORMAT['1h'];
  }
  return pattern;
}

/**
 * Calculate optimal tick positions to prevent overlap
 * Ensures labels are evenly distributed and readable
 *
 * @param {Array} data - Chart data array with timestamp properties
 * @param {number} maxLabels - Maximum number of labels to show
 * @returns {Array} Array of indices for label positions
 */
function calculateOptimalTickPositions(data, maxLabels) {
  if (!data || data.length === 0) return [];

  if (data.length <= maxLabels) {
    // Show all points if we have few enough
    return data.map((_, index) => index);
  }

  // Calculate step size to distribute labels evenly
  const step = Math.floor(data.length / (maxLabels - 1));
  const positions = [];

  // Always include first position
  positions.push(0);

  // Add evenly spaced positions (fixed: don't stop too early)
  for (let i = step; i < data.length - 1; i += step) {
    positions.push(i);
  }

  // Always include last position (most recent time) if not already included
  const lastIndex = data.length - 1;
  if (data.length > 1 && positions[positions.length - 1] !== lastIndex) {
    positions.push(lastIndex);
  }

  return positions;
}

/**
 * Format timestamp for display on chart axis
 * Uses user's locale and timezone for proper international support
 *
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @param {Object} formatOptions - Intl.DateTimeFormat options
 * @param {string} locale - User locale (optional, defaults to browser locale)
 * @param {string} customFormat - Special format override (e.g., 'dayMonthTime')
 * @returns {string} Formatted time string
 */
function formatTimestampForDisplay(unixTimestamp, formatOptions, locale = undefined, customFormat = null) {
  const localDate = convertBackendTimestampToLocal(unixTimestamp);

  try {
    // Handle custom formats for cleaner display
    if (customFormat === 'dayMonthTime') {
      const parts = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: undefined
      }).formatToParts(localDate);

      const day = parts.find(p => p.type === 'day').value;
      const month = parts.find(p => p.type === 'month').value;
      const hour = parts.find(p => p.type === 'hour').value;
      const minute = parts.find(p => p.type === 'minute').value;

      return `${day} ${month} ${hour}:${minute}`;
    }

    // Handle numeric month formats
    if (customFormat === 'dayNumericMonthTime') {
      const parts = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: undefined
      }).formatToParts(localDate);

      const day = parts.find(p => p.type === 'day').value;
      const month = parts.find(p => p.type === 'month').value;
      const hour = parts.find(p => p.type === 'hour').value;
      const minute = parts.find(p => p.type === 'minute').value;

      return `${day}/${month} ${hour}:${minute}`;
    }

    if (customFormat === 'dayNumericMonth') {
      const parts = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: '2-digit',
        timeZone: undefined
      }).formatToParts(localDate);

      const day = parts.find(p => p.type === 'day').value;
      const month = parts.find(p => p.type === 'month').value;

      return `${day}/${month}`;
    }

    // Use standard Intl.DateTimeFormat for regular formats
    return new Intl.DateTimeFormat(locale, {
      ...formatOptions,
      timeZone: undefined // Use user's local timezone
    }).format(localDate);
  } catch (error) {
    console.warn('TimeAxisFormatter: Error formatting timestamp', error);
    // Fallback to basic formatting
    return localDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

/**
 * Generate smart time labels for chart X-axis
 * Uses timeframe-specific formatting patterns
 *
 * @param {Array} chartData - Array of chart data with timestamp properties
 * @param {string} timeframe - Current timeframe (determines format)
 * @returns {Object} { ticks: Array, formatOptions: Object }
 */
function generateSmartTimeLabels(chartData, timeframe) {
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return { ticks: [], formatOptions: {} };
  }

  // Get timeframe-specific pattern
  const pattern = getTimeframePattern(timeframe);

  // Calculate optimal tick positions
  const tickPositions = calculateOptimalTickPositions(chartData, pattern.maxLabels);

  // Generate tick data with formatted labels
  const ticks = tickPositions.map(index => {
    const dataPoint = chartData[index];
    const isCustomFormat = typeof pattern.format === 'string';

    return {
      index,
      timestamp: dataPoint.timestamp,
      label: isCustomFormat
        ? formatTimestampForDisplay(dataPoint.timestamp, {}, undefined, pattern.format)
        : formatTimestampForDisplay(dataPoint.timestamp, pattern.format),
      rawData: dataPoint
    };
  });

  return {
    ticks,
    formatOptions: pattern.format,
    timeframe,
    maxLabels: pattern.maxLabels
  };
}

/**
 * Create X-axis tick formatter function for Recharts
 * Returns a function that Recharts can use directly
 *
 * @param {Array} chartData - Chart data array
 * @param {string} timeframe - Current timeframe
 * @returns {Function} Formatter function for Recharts XAxis
 */
function createXAxisTickFormatter(chartData, timeframe) {
  const { ticks, formatOptions } = generateSmartTimeLabels(chartData, timeframe);

  // Create a lookup map for performance
  const tickMap = new Map();
  ticks.forEach(tick => {
    tickMap.set(tick.timestamp, tick.label);
  });

  // Return formatter function that Recharts will call
  return (timestamp) => {
    // Only show labels for our calculated tick positions
    return tickMap.get(timestamp) || '';
  };
}

/**
 * Debug helper to log timezone conversion info
 * Useful for development and troubleshooting
 *
 * @param {number} unixTimestamp - Unix timestamp to analyze
 */
function debugTimezoneConversion(unixTimestamp) {
  if (process.env.NODE_ENV === 'development') {
    const localDate = convertBackendTimestampToLocal(unixTimestamp);
    const utcDate = new Date(unixTimestamp * 1000);

    console.log('🕐 Timezone Debug:', {
      unixTimestamp,
      backendTime: 'US-East (assumed)',
      userLocalTime: localDate.toLocaleString(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcTime: utcDate.toUTCString(),
      timezoneOffset: localDate.getTimezoneOffset() / 60 + ' hours from UTC'
    });
  }
}

// Export functions for use in components
module.exports = {
  // Main functions
  generateSmartTimeLabels,
  createXAxisTickFormatter,

  // Utility functions
  convertBackendTimestampToLocal,
  formatTimestampForDisplay,
  getTimeframePattern,

  // Debug functions
  debugTimezoneConversion,

  // Constants for direct access if needed
  TIMEFRAME_TO_FORMAT
};