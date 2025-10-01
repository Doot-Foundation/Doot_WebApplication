/**
 * @module SecureDoHClient
 *
 * @description
 * A secure DNS-over-HTTPS (DoH) client with certificate pinning and fallback.
 * It ensures trusted DNS resolution before fetching data from crypto APIs.
 *
 * Key Features:
 * 1. **Certificate Pinning**: Verifies DoH servers using SHA-256 fingerprints.
 * 2. **Fallback & Retries**: Tries multiple DoH providers, with exponential backoff on failures.
 * 3. **DNS Caching**: Stores DNS results (TTL-based) to reduce repeated lookups.
 * 4. **Secure Crypto Fetch**: Resolves crypto API domains via pinned DoH, then makes HTTPS calls using the resolved IP and standard CA checks.
 *
 * Usage:
 *  - `resolveWithDoH(domain[, type[, options]])`: Securely resolves a domain via pinned DoH.
 *  - `fetchCryptoData(provider, coinId[, options])`: Fetches crypto prices using DoH-secured DNS resolution.
 *
 * Security Considerations:
 *  - Only DoH endpoints are pinned; final APIs use normal TLS validation.
 *  - Pinned certs must be updated if a DoH provider’s cert changes or is revoked.
 *  - Hostname checks for DoH are bypassed in favor of fingerprint pinning.
 */

const axios = require("axios");
const https = require("https");
const crypto = require("crypto");
const {
  logError,
  logSuccess,
  logWarning,
  logDebug,
  logInfo,
} = require("../helpers");
const { DOH_PROVIDERS } = require("../../config/doh.js");
const { logErrorToFile } = require("../errorLogger");
const { redis } = require("../helper/init/InitRedis");
const { DNS_CACHE_KEY_PREFIX, CERTIFICATE_CACHE_KEY } = require("../constants/others");

// DNS cache configuration
const DEFAULT_TTL = 10800000; // 3 hours in milliseconds
const DEFAULT_TTL_SECONDS = 10800; // 3 hours in seconds (for Redis EX)
const MAX_RETRIES = 3;

/**
 * Certificate fingerprints for DoH providers
 * Format: SHA-256 of the certificate's public key in both Base64 and Hex formats
 * Multiple fingerprints per provider for certificate rotation
 */

// List of DoH providers in order of preference

// Crypto API endpoints with recommended headers
const CRYPTO_APIS = {
  binance: (id) =>
    `https://api.binance.com/api/v3/ticker/price?symbol=${id}USDT`,
  cryptocompare: (id) =>
    `https://min-api.cryptocompare.com/data/price?fsym=${id}&tsyms=USD`,
  coinpaprika: (id) => `https://api.coinpaprika.com/v1/tickers/${id}`,
  messari: (id) => `https://data.messari.io/api/v1/assets/${id}/metrics`,
  coincap: (id) => `https://api.coincap.io/v2/assets/${id}`,
  coinlore: (id) => `https://api.coinlore.net/api/ticker/?id=${id}`,
  coincodex: (id) => `https://coincodex.com/api/coincodex/get_coin/${id}`,
  coingecko: (id) =>
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
  kucoin: (id) =>
    `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${id}-USDT`,
  huobi: (id) =>
    `https://api.huobi.pro/market/history/trade?symbol=${id}usdt&size=1`,
  bybit: (id) =>
    `https://api-testnet.bybit.com/v5/market/tickers?category=spot&symbol=${id}USDT`,
  "cex.io": (id) => `https://cex.io/api/last_price/${id}/USD`,
  swapzone: (id) =>
    `https://api.swapzone.io/v1/exchange/get-rate?from=${id}&to=usdc&amount=1000`,
  mexc: (id) => `https://api.mexc.com/api/v3/ticker/price?symbol=${id}USDT`,
  "gate.io": (id) =>
    `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${id}_USDT`,
  okx: (id) => `https://www.okx.com/api/v5/market/ticker?instId=${id}-USDT`,
};

const DEFAULT_API_HEADERS = {
  swapzone: {
    "x-api-key": "YOUR_SWAPZONE_API_KEY",
    "Content-Type": "application/json",
  },
};

/**
 * Advanced verification for certificate pinning
 * Verifies both traditional certificate fields and SHA-256 fingerprints
 *
 * @param {Object} provider - DoH provider configuration
 * @param {Object} cert - TLS certificate object
 * @param {Array<string>} pinnedFingerprints - Array of valid fingerprints (from Redis or config)
 * @returns {Error|null} - Returns null if valid, Error if invalid
 */
function verifyCertificate(provider, cert, pinnedFingerprints) {
  try {
    // Get the certificate's public key
    const pubKey = cert.pubkey;

    // Create SHA-256 fingerprint in base64 format
    const fingerprint = crypto
      .createHash("sha256")
      .update(pubKey)
      .digest("base64");

    // Create SHA-256 fingerprint in hex format with colons
    const buffer = Buffer.from(pubKey);
    const fingerprintHex = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex")
      .match(/.{2}/g)
      .join(":")
      .toUpperCase();

    // Check if either fingerprint format matches our pinned fingerprints
    const isBase64Valid = pinnedFingerprints.some(
      (pin) => pin === fingerprint || pin === fingerprintHex
    );

    if (!isBase64Valid) {
      console.error(
        `Certificate fingerprint validation failed for ${provider.name}`
      );
      console.error(`Got: ${fingerprint}`);
      console.error(`Hex: ${fingerprintHex}`);
      console.error(
        `Expected one of: ${pinnedFingerprints.join(", ")}`
      );
      return new Error(
        `Certificate pinning verification failed for ${provider.name}`
      );
    }

    // Verify certificate is not expired
    const now = new Date();
    if (now < new Date(cert.valid_from) || now > new Date(cert.valid_to)) {
      return new Error(
        `Certificate for ${provider.name} is outside its validity period`
      );
    }

    return null; // Certificate is valid
  } catch (error) {
    return new Error(`Certificate validation error: ${error.message}`);
  }
}

/**
 * Creates a custom HTTPS agent with certificate pinning
 *
 * @param {Object} provider - DoH provider configuration
 * @param {Array<string>} pinnedFingerprints - Array of valid fingerprints from Redis
 * @returns {https.Agent} - HTTPS agent with pinning configuration
 */
function createPinnedAgent(provider, pinnedFingerprints) {
  return new https.Agent({
    rejectUnauthorized: true,
    checkServerIdentity: (host, cert) => {
      // Skip certificate pinning if no fingerprints are provided
      if (!pinnedFingerprints || pinnedFingerprints.length === 0) {
        logDebug(
          `No certificate pins configured for ${provider.name}. Running in insecure mode.`
        );
        return null;
      }

      return verifyCertificate(provider, cert, pinnedFingerprints);
    },
    timeout: 5000, // 5 second connection timeout
  });
}

/**
 * Resolve a domain using DNS over HTTPS with cascading fallback
 *
 * @param {string} domain - Domain to resolve
 * @param {string} type - DNS record type (default: A)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - DNS response data
 */
async function resolveWithDoH(domain, type = "A", options = {}) {
  const {
    cacheTTL = DEFAULT_TTL,
    timeout = 10000,
    forceRefresh = false,
  } = options;

  const cacheKey = `${DNS_CACHE_KEY_PREFIX}:${domain}:${type}`;

  // Check Redis cache first (unless forced refresh)
  if (!forceRefresh) {
    try {
      const cachedEntry = await redis.get(cacheKey);
      if (cachedEntry) {
        // Upstash auto-deserializes, use directly
        logInfo(`[DoH] Cache hit for ${domain} (${type})`);
        return cachedEntry.data;
      }
    } catch (error) {
      logWarning(`[DoH] Cache read error for ${domain}: ${error.message}`);
      // Continue to DNS resolution on cache error
    }
  }

  let lastError = null;
  let providerIdx = 0;

  // Try each provider with exponential backoff
  while (providerIdx < DOH_PROVIDERS.length) {
    const provider = DOH_PROVIDERS[providerIdx];
    const retryDelays = [0, 1000, 3000]; // Milliseconds to wait between retries

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      // Wait for the appropriate delay (skip on first attempt)
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelays[attempt])
        );
      }

      try {
        logInfo(
          `[DoH] Attempting to resolve ${domain} (type: ${type}) using ${
            provider.name
          }, attempt ${attempt + 1}`
        );

        // Fetch fingerprints from Redis (with fallback to config)
        let pinnedFingerprints;
        try {
          const redisKey = `${CERTIFICATE_CACHE_KEY}:${provider.name}`;
          const cachedFingerprints = await redis.get(redisKey);

          if (cachedFingerprints) {
            // Upstash auto-deserializes, use directly
            pinnedFingerprints = cachedFingerprints;
            logInfo(`[DoH] Using Redis fingerprints for ${provider.name} (${pinnedFingerprints.length} pins)`);
          } else {
            // Fallback to config if Redis is empty
            pinnedFingerprints = provider.fingerprints?.sha256 || [];
            logWarning(`[DoH] No Redis fingerprints for ${provider.name}, using config fallback`);
          }
        } catch (error) {
          // Fallback to config on Redis error
          pinnedFingerprints = provider.fingerprints?.sha256 || [];
          logWarning(`[DoH] Redis error for ${provider.name}, using config fallback: ${error.message}`);
        }

        // Create agent with certificate pinning (using Redis or config fingerprints)
        const httpsAgent = createPinnedAgent(provider, pinnedFingerprints);

        // Prepare query
        const url = `https://${provider.hostname}${provider.path}`;
        const response = await axios({
          method: "get",
          url: url,
          params: {
            name: domain,
            type: type,
          },
          headers: {
            accept: "application/dns-json",
          },
          httpsAgent: httpsAgent,
          timeout: timeout,
        });

        const result = response.data;

        // Verify we got a valid response with answers
        if (
          result &&
          (result.Answer || (result.Status === 0 && result.Authority))
        ) {
          logSuccess(
            `[DoH] Successfully resolved ${domain} using ${provider.name}`
          );

          // Cache the result in Redis with TTL
          try {
            const cacheData = {
              data: result,
              expiry: Date.now() + cacheTTL,
              cachedAt: Date.now(),
              provider: provider.name, // Track which DoH provider was used
            };
            // Set with TTL in seconds (Upstash auto-serializes)
            const ttlSeconds = Math.floor(cacheTTL / 1000);
            await redis.set(cacheKey, cacheData, {
              ex: ttlSeconds,
            });
            logInfo(`[DoH] Cached ${domain} resolution for ${ttlSeconds}s`);
          } catch (error) {
            logWarning(`[DoH] Failed to cache ${domain}: ${error.message}`);
            // Continue even if caching fails
          }

          return result;
        } else {
          throw new Error(
            `Invalid or empty DNS response from ${provider.name}`
          );
        }
      } catch (error) {
        lastError = error;
        const errorMsg = error.response
          ? `HTTP ${error.response.status}: ${error.response.statusText}`
          : error.message;

        logWarning(
          `[DoH] Provider ${provider.name} failed on attempt ${
            attempt + 1
          }: ${errorMsg}`
        );

        // If it's a certificate error or network error, move to next provider immediately
        if (
          error.message.includes("certificate") ||
          error.code === "ECONNREFUSED" ||
          error.code === "ENOTFOUND"
        ) {
          break; // Exit retry loop, try next provider
        }

        // Continue to next retry attempt
      }
    }

    // Move to next provider
    providerIdx++;
  }

  // All providers failed
  const errorMessage = `All DNS providers failed to resolve ${domain}. Last error: ${lastError?.message}`;
  console.error(`[DoH] ${errorMessage}`);
  await logErrorToFile("DoH_RESOLVER", errorMessage, lastError);
  throw new Error(errorMessage);
}

/**
 * Extract IP addresses from DNS response
 *
 * @param {Object} dnsResponse - Response from DoH query
 * @returns {Array<string>} - Array of IP addresses
 */
function extractIPs(dnsResponse) {
  if (!dnsResponse || !dnsResponse.Answer) {
    return [];
  }

  return dnsResponse.Answer.filter((record) => record.type === 1) // Type 1 = A record
    .map((record) => record.data);
}

/**
 * Parse a URL to extract hostname and path
 *
 * @param {string} url - URL to parse
 * @returns {Object} - Object with hostname and path
 */
function parseUrl(url) {
  try {
    const urlObj = new URL(url);
    return {
      hostname: urlObj.hostname,
      path: `${urlObj.pathname}${urlObj.search}`,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
    };
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Unified crypto API client with DoH security
 * Fetches data from cryptocurrency APIs with secure DNS resolution
 *
 * @param {string} provider - Crypto API provider name
 * @param {string} coinId - Cryptocurrency ID/symbol
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response data
 */
async function fetchCryptoData(provider, coinId, options = {}) {
  const {
    timeout = 15000,
    useDoh = true,
    dohOptions = {},
    maxRetries = MAX_RETRIES,
    headers = {}, // Custom headers for API authentication
  } = options;

  let useDohLocal = useDoh;

  // Get the API URL template
  const urlTemplate = CRYPTO_APIS[provider];
  if (!urlTemplate) {
    throw new Error(`Unknown API provider: ${provider}`);
  }

  // Build the full URL
  const fullUrl = urlTemplate(coinId);
  const { hostname, path } = parseUrl(fullUrl);

  // Merge default API-specific headers with custom headers
  const apiHeaders = DEFAULT_API_HEADERS[provider] || {};
  const mergedHeaders = { ...apiHeaders, ...headers };

  // Initialize performance metrics
  const metrics = {
    provider,
    coinId,
    startTime: Date.now(),
    dnsResolutionTime: null,
    connectionTime: null,
    totalTime: null,
    attempt: 0,
    success: false,
  };

  let lastError = null;

  // Retry loop
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    metrics.attempt = attempt + 1;

    try {
      // Use DoH to resolve the hostname if enabled
      let ipAddress = hostname; // Default to using hostname directly

      if (useDohLocal) {
        logInfo(`[API] Resolving ${hostname} via DoH for ${provider} API`);
        const dnsStartTime = Date.now();
        const dnsResponse = await resolveWithDoH(hostname, "A", dohOptions);
        metrics.dnsResolutionTime = Date.now() - dnsStartTime;

        const ips = extractIPs(dnsResponse);
        if (ips.length === 0) {
          throw new Error(`No IP addresses found for ${hostname}`);
        }

        // Use the first IP returned
        ipAddress = ips[0];
        logSuccess(`[API] Resolved ${hostname} to ${ipAddress}`);
      }

      // Setup HTTPS request with SNI
      const httpsAgent = new https.Agent({
        rejectUnauthorized: true,
        servername: hostname, // Important: Set SNI to original hostname
      });

      let userAgent = "SecureCryptoClient/1.0";

      // Fetch data from the API
      const response = await axios({
        method: "get",
        url: useDohLocal ? `https://${ipAddress}${path}` : fullUrl,
        headers: {
          Host: hostname, // Important: Set Host header to original hostname
          Accept: "application/json",
          "User-Agent": userAgent, // Custom user agent
          ...mergedHeaders, // Add merged headers (default API + custom headers)
        },
        httpsAgent,
        timeout,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Calculate metrics
      metrics.totalTime = Date.now() - metrics.startTime;
      metrics.success = true;

      logSuccess(
        `[RESULTS] Successfully fetched data from ${provider} for ${coinId} (${metrics.totalTime}ms)`
      );

      // Include headers in the return value for compatibility with callSignAPICall
      return {
        data: response.data,
        headers: response.headers, // Add response headers for timestamp extraction
        metrics,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      lastError = error;
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;

      logWarning(
        `[API] ${provider} API request failed (attempt ${
          attempt + 1
        }): ${errorMsg}`
      );

      // Add exponential backoff between retries
      if (attempt < maxRetries - 1) {
        const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        logError(
          `[API] Failed too many times. Retrying in ${backoffTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }

  // All attempts failed
  metrics.totalTime = Date.now() - metrics.startTime;
  metrics.success = false;

  const errorMessage = `Failed to fetch data from ${provider} for ${coinId} after ${maxRetries} attempts. Last error: ${lastError?.message}`;
  console.error(`[API] ${errorMessage}`);
  await logErrorToFile("CRYPTO_API", errorMessage, lastError);

  throw {
    error: new Error(errorMessage),
    metrics,
  };
}

module.exports = {
  fetchCryptoData,
  resolveWithDoH,
  extractIPs,
  DOH_PROVIDERS,
  CRYPTO_APIS,
  DEFAULT_API_HEADERS,
};
