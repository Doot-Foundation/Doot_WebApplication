const https = require("https");
const crypto = require("crypto");
const { DOH_PROVIDERS } = require("./config/doh");
const { CERTIFICATE_CACHE_KEY } = require("./utils/constants/others");
const { redis } = require("./utils/helper/init/InitRedis");
const {
  logSuccess,
  logWarning,
  logError,
  logInfo,
  logAlert,
} = require("./utils/helpers");
const { logErrorToFile } = require("./utils/errorLogger");

// ----------
// IMPORTANT NOTE REGARDING `rejectUnauthorized` OPTION.
// ----------
// We intentionally disable TLS certificate validation here
// because we're connecting directly to a DNS resolver by IP (e.g., 8.8.8.8, 1.1.1.1).
//
// Instead, we manually verify the certificate fingerprint and monitor for changes
// to protect against DNS poisoning and MITM attacks. This is safe only because:
// 1. The IP is hardcoded and trusted.
// 2. We never use this pattern for general-purpose HTTPS requests.
function fetchCertificate(hostname) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      method: "HEAD",
      timeout: 10000,
      rejectUnauthorized: false,
      headers: {
        Connection: "close",
      },
      agent: new https.Agent({
        keepAlive: false,
        maxSockets: 1,
        rejectUnauthorized: false,
      }),
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate(true);

      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error(`No certificate found for ${hostname}`));
        return;
      }

      resolve(cert);

      res.socket.destroy();
    });

    req.on("error", (error) => {
      reject(
        new Error(
          `Failed to fetch certificate for ${hostname}: ${error.message}`
        )
      );
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout while fetching certificate for ${hostname}`));
    });

    req.end();
  });
}

function calculateSHA256Fingerprint(cert) {
  if (!cert || !cert.raw) {
    throw new Error("Invalid certificate or missing raw data");
  }

  const hash = crypto.createHash("sha256");
  hash.update(cert.raw);
  return hash.digest("base64");
}

/**
 * Initialize certificate fingerprints in Redis (Upstash-compatible)
 * Stores fingerprints as JSON string arrays
 * @param {Array} providers - Array of DoH provider configs
 */
async function initializeFingerprintsInRedis(providers) {
  for (const provider of providers) {
    const { name, fingerprints } = provider;
    const redisKey = `${CERTIFICATE_CACHE_KEY}:${name}`;

    try {
      // Get existing fingerprints (JSON string or null)
      const existingData = await redis.get(redisKey);

      // Only initialize if key doesn't exist
      if (!existingData) {
        if (
          fingerprints &&
          fingerprints.sha256 &&
          fingerprints.sha256.length > 0
        ) {
          // Store array directly - Upstash auto-serializes
          await redis.set(redisKey, fingerprints.sha256);
          logInfo(`Initialized ${name} certificate fingerprints in Redis`);
        }
      } else {
        logInfo(`${name} certificate fingerprints already exist in Redis`);
      }
    } catch (error) {
      logError(`Failed to initialize ${name} fingerprints: ${error.message}`);
      await logErrorToFile(
        "CERTIFICATE_SERVICE",
        `Failed to initialize ${name} fingerprints`,
        error
      );
    }
  }
}

/**
 * Get certificate fingerprints from Redis (Upstash-compatible)
 * @param {string} providerName - DoH provider name (e.g., "cloudflare")
 * @returns {Promise<Array<string>>} Array of fingerprints
 */
async function getFingerprintsFromRedis(providerName) {
  const redisKey = `${CERTIFICATE_CACHE_KEY}:${providerName}`;

  try {
    const data = await redis.get(redisKey);

    if (!data) {
      return [];
    }

    // Upstash auto-deserializes, return directly
    return data;
  } catch (error) {
    logError(`Failed to get ${providerName} fingerprints: ${error.message}`);
    return [];
  }
}

/**
 * Update certificate fingerprints in Redis (Upstash-compatible)
 * Adds new fingerprint to front, keeps last 4 fingerprints
 * @param {string} providerName - DoH provider name
 * @param {string} newFingerprint - New SHA-256 fingerprint
 * @param {number} maxEntries - Max fingerprints to keep (default: 4)
 */
async function updateFingerprintsInRedis(
  providerName,
  newFingerprint,
  maxEntries = 4
) {
  const redisKey = `${CERTIFICATE_CACHE_KEY}:${providerName}`;

  try {
    // Get existing fingerprints (Upstash auto-deserializes)
    const existingData = await redis.get(redisKey);
    let fingerprints = existingData || [];

    // Add new fingerprint to front
    fingerprints.unshift(newFingerprint);

    // Keep only the first maxEntries items
    fingerprints = fingerprints.slice(0, maxEntries);

    // Store array directly (Upstash auto-serializes)
    await redis.set(redisKey, fingerprints);

    logInfo(`Updated ${providerName} certificate fingerprints in Redis`);
  } catch (error) {
    logError(`Failed to update ${providerName} fingerprints: ${error.message}`);
    await logErrorToFile(
      "CERTIFICATE_SERVICE",
      `Failed to update ${providerName} fingerprints`,
      error
    );
  }
}
async function validateCertificates() {
  for (const provider of DOH_PROVIDERS) {
    try {
      const { name, hostname } = provider;
      logInfo(`Checking certificates for ${name} (${hostname})`);

      const knownFingerprints = await getFingerprintsFromRedis(name);

      const cert = await fetchCertificate(hostname);
      const currentFingerprint = calculateSHA256Fingerprint(cert);

      const isKnown = knownFingerprints.includes(currentFingerprint);

      // Convert subject/issuer to safe strings for logging
      const subjectString = cert.subject
        ? JSON.stringify(cert.subject)
        : "Not available";
      const issuerString = cert.issuer
        ? JSON.stringify(cert.issuer)
        : "Not available";

      const certDetails = {
        subject: subjectString,
        issuer: issuerString,
        valid_from: cert.valid_from || "Not available",
        valid_to: cert.valid_to || "Not available",
        acquisition_date: new Date().toISOString(),
      };

      if (isKnown) {
        if (knownFingerprints[0] === currentFingerprint) {
          logInfo(`Certificate for ${name} is current and valid.`);
        } else {
          logWarning(
            `Certificate for ${name} matches a previous/backup fingerprint`
          );
          await updateFingerprintsInRedis(name, currentFingerprint);
        }
      } else {
        logWarning("---------- CERTIFICATE CHANGE DETECTED ----------");
        logAlert(`Provider: ${name} (${hostname})`);
        logAlert("Current known fingerprints:");
        knownFingerprints.forEach((fp, i) => {
          logAlert(`  ${i === 0 ? "Current" : "Previous"}: ${fp}`);
        });
        logAlert(`New certificate fingerprint: ${currentFingerprint}`);
        logAlert("Certificate Details:");
        logAlert(`  Acquisition Date: ${certDetails.acquisition_date}`);
        logAlert(`  Subject: ${certDetails.subject}`);
        logAlert(`  Issuer: ${certDetails.issuer}`);
        logAlert(`  Valid From: ${certDetails.valid_from}`);
        logAlert(`  Valid To: ${certDetails.valid_to}`);

        await updateFingerprintsInRedis(name, currentFingerprint);

        logSuccess("Certificate fingerprints updated in Redis.");
        logAlert(
          "----------------------------------------------------------------\n"
        );

        let detailedMessage =
          "\n---------- CERTIFICATE CHANGE DETECTED ----------\n";
        detailedMessage += `Provider: ${name} (${hostname})\n`;
        detailedMessage += "Current known fingerprints:\n";
        knownFingerprints.forEach((fp, i) => {
          detailedMessage += `  ${i === 0 ? "Current" : "Previous"}: ${fp}\n`;
        });
        detailedMessage += `New certificate fingerprint: ${currentFingerprint}\n`;
        detailedMessage += "Certificate Details:\n";
        detailedMessage += `  Acquisition Date: ${certDetails.acquisition_date}\n`;
        detailedMessage += `  Subject: ${certDetails.subject}\n`;
        detailedMessage += `  Issuer: ${certDetails.issuer}\n`;
        detailedMessage += `  Valid From: ${certDetails.valid_from}\n`;
        detailedMessage += `  Valid To: ${certDetails.valid_to}\n\n`;
        detailedMessage += "Certificate fingerprints updated in Redis.\n";
        await logErrorToFile("CERTIFICATE_SERVICE", detailedMessage);
      }
    } catch (error) {
      logError(
        `Error validating certificate for ${provider.name}: ${error.message}`
      );
      await logErrorToFile(
        "CERTIFICATE_SERVICE",
        `Error validating certificate for ${provider.name}`,
        error
      );
    }
  }
}

async function initializeCertificateValidation() {
  await initializeFingerprintsInRedis(DOH_PROVIDERS);
  logInfo("Certificate validation service initialized.");
  return true;
}

module.exports = {
  validateCertificates,
  initializeCertificateValidation,
};
