// ============================================
// DoH Security & DNS Caching Keys
// ============================================

/**
 * Certificate fingerprint cache key
 * Stores SHA-256 fingerprints for each DoH provider
 * Structure: "doh:certificates:{provider_name}" → JSON object with fingerprints
 * Example: "doh:certificates:cloudflare" → '{"fingerprints": ["fp1", "fp2", "fp3", "fp4"]}'
 *
 * Note: Uses Redis HASH (Upstash compatible) instead of Lists
 */
const CERTIFICATE_CACHE_KEY = "doh:certificates";

/**
 * DNS resolution cache key prefix
 * Stores DoH DNS resolutions with TTL
 * Structure: "doh:dns:{hostname}" → JSON string of DNS response
 * Example: "doh:dns:api.binance.com" → '{"Answer": [{"data": "1.2.3.4"}]}'
 *
 * TTL: 3 hours (10800 seconds)
 */
const DNS_CACHE_KEY_PREFIX = "doh:dns";

/**
 * Certificate monitoring state key
 * Stores last check timestamp and status
 * Structure: "doh:cert_monitor:last_check" → timestamp
 */
const CERT_MONITOR_KEY = "doh:cert_monitor";

// ============================================
// Color Constants for Console Logging
// ============================================

const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  DIM: "\x1b[2m",

  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  SUPER_BRIGHT_CYAN: "\x1b[1;96m",

  BG_RED: "\x1b[41m",
  BG_GREEN: "\x1b[42m",
  BG_YELLOW: "\x1b[43m",
};

// ============================================
// Exports
// ============================================

module.exports = {
  CERTIFICATE_CACHE_KEY,
  DNS_CACHE_KEY_PREFIX,
  CERT_MONITOR_KEY,
  COLORS,
};
