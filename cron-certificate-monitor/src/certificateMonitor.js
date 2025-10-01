const https = require('https');
const crypto = require('crypto');
const { redis } = require('./utils/init/InitRedis');
const { DOH_PROVIDERS } = require('./config/doh');
const { logSuccess, logError, logInfo, logWarn } = require('./utils/helpers');

// Redis keys - Updated to match cron-update-all-prices-doh structure
const CERTIFICATE_CACHE_KEY = 'doh:certificates';  // Base key for fingerprints
const REDIS_KEY_CERT_HISTORY = 'doh:cert_monitor:history';
const REDIS_KEY_LAST_CHECK = 'doh:cert_monitor:last_check';

/**
 * Fetch TLS certificate from a host
 */
async function fetchCertificate(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: port,
      method: 'GET',
      rejectUnauthorized: false,  // We're validating manually via fingerprint
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (!cert || Object.keys(cert).length === 0) {
        return reject(new Error('No certificate found'));
      }

      resolve(cert);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

/**
 * Calculate SHA-256 fingerprint of certificate public key
 * IMPORTANT: Uses cert.pubkey (not cert.raw) to match pinned fingerprints in doh.js config
 */
function calculateFingerprint(cert) {
  if (!cert.pubkey) {
    throw new Error('Certificate missing public key data');
  }

  const hash = crypto.createHash('sha256');
  hash.update(cert.pubkey);
  return hash.digest('base64'); // BASE64 format to match pinned fingerprints
}

/**
 * Validate a single DoH provider
 * Fetches fingerprints from Redis, falls back to config
 */
async function validateProvider(providerName, providerConfig) {
  logInfo(`Checking ${providerName}...`);

  try {
    const cert = await fetchCertificate(providerConfig.hostname);
    const fingerprint = calculateFingerprint(cert);

    // Fetch current fingerprints from Redis
    const redisKey = `${CERTIFICATE_CACHE_KEY}:${providerName}`;
    let knownFingerprints;

    try {
      const cachedFingerprints = await redis.get(redisKey);
      if (cachedFingerprints) {
        // Upstash auto-deserializes, use directly
        knownFingerprints = cachedFingerprints;
        logInfo(`Using Redis fingerprints for ${providerName} (${knownFingerprints.length} pins)`);
      } else {
        // Fallback to config if Redis is empty
        knownFingerprints = providerConfig.pinnedFingerprints || [];
        logWarn(`No Redis fingerprints for ${providerName}, using config fallback`);
      }
    } catch (error) {
      // Fallback to config on Redis error
      knownFingerprints = providerConfig.pinnedFingerprints || [];
      logWarn(`Redis error for ${providerName}, using config fallback: ${error.message}`);
    }

    // Check if fingerprint matches known ones
    const isPinned = knownFingerprints.includes(fingerprint);

    if (isPinned) {
      logSuccess(`✓ ${providerName}: Certificate valid`);
      return {
        provider: providerName,
        status: 'valid',
        fingerprint,
        isPinned: true,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        issuer: cert.issuer.O,
        subject: cert.subject.CN,
      };
    } else {
      logWarn(`⚠ ${providerName}: NEW CERTIFICATE DETECTED!`);
      logWarn(`  Current: ${fingerprint}`);
      logWarn(`  Known:  ${knownFingerprints[0] || 'none'}`);

      // Update Redis with new fingerprint (prepend, keep last 4)
      try {
        const updatedFingerprints = [fingerprint, ...knownFingerprints].slice(0, 4);
        // Upstash auto-serializes, store directly
        await redis.set(redisKey, updatedFingerprints);
        logInfo(`Updated ${providerName} fingerprints in Redis`);
      } catch (error) {
        logError(`Failed to update ${providerName} fingerprints in Redis: ${error.message}`);
      }

      return {
        provider: providerName,
        status: 'changed',
        fingerprint,
        isPinned: false,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        issuer: cert.issuer.O,
        subject: cert.subject.CN,
        knownFingerprints,
      };
    }

  } catch (error) {
    logError(`✗ ${providerName}: ${error.message}`);

    return {
      provider: providerName,
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Store certificate history in Redis
 */
async function storeCertificateHistory(results) {
  try {
    const history = await redis.get(REDIS_KEY_CERT_HISTORY);
    const historyArray = history ? JSON.parse(history) : [];

    // Add new entry
    historyArray.unshift({
      timestamp: Date.now(),
      results: results.map(r => ({
        provider: r.provider,
        status: r.status,
        fingerprint: r.fingerprint || null,
      })),
    });

    // Keep last 100 checks (100 * 6 hours = 25 days of history)
    const trimmedHistory = historyArray.slice(0, 100);

    await redis.set(REDIS_KEY_CERT_HISTORY, JSON.stringify(trimmedHistory));

    logInfo('Certificate history updated');

  } catch (error) {
    logError('Failed to store certificate history:', error.message);
  }
}

/**
 * Store current certificate state in Redis
 */
async function storeCertificateState(results) {
  try {
    const state = {};

    for (const result of results) {
      if (result.status === 'valid' || result.status === 'changed') {
        state[result.provider] = {
          fingerprint: result.fingerprint,
          isPinned: result.isPinned,
          validFrom: result.validFrom,
          validTo: result.validTo,
          issuer: result.issuer,
          subject: result.subject,
          lastChecked: Date.now(),
          status: result.status,
        };
      } else {
        state[result.provider] = {
          status: 'failed',
          error: result.error,
          lastChecked: Date.now(),
        };
      }
    }

    await redis.set(REDIS_KEY_CERTIFICATES, JSON.stringify(state));
    await redis.set(REDIS_KEY_LAST_CHECK, Date.now().toString());

    logSuccess('Certificate state stored in Redis');

  } catch (error) {
    logError('Failed to store certificate state:', error.message);
  }
}

/**
 * Main monitoring function
 */
async function monitorCertificates() {
  const results = [];

  // Validate all providers in parallel
  const validationPromises = Object.entries(DOH_PROVIDERS).map(
    ([name, config]) => validateProvider(name, config)
  );

  const validationResults = await Promise.all(validationPromises);
  results.push(...validationResults);

  // Calculate statistics
  const stats = {
    totalProviders: results.length,
    validProviders: results.filter(r => r.status === 'valid').length,
    changedProviders: results.filter(r => r.status === 'changed').length,
    failedProviders: results.filter(r => r.status === 'failed').length,
  };

  // Store results in Redis
  await storeCertificateState(results);
  await storeCertificateHistory(results);

  // Print summary
  console.log('\n─────────────────────────────────────────────');
  console.log('VALIDATION SUMMARY:');
  results.forEach(r => {
    const icon = r.status === 'valid' ? '✓' : r.status === 'changed' ? '⚠' : '✗';
    console.log(`  ${icon} ${r.provider.padEnd(15)} ${r.status.toUpperCase()}`);
  });
  console.log('─────────────────────────────────────────────\n');

  return { ...stats, results };
}

module.exports = { monitorCertificates };
