const axios = require("axios");
const https = require("https");
const _ = require("lodash");
const { CircuitString } = require("o1js");
const { testnetSignatureClient } = require("./init/InitSignatureClient");
const { MULTIPLICATION_FACTOR } = require("../constants/info");
const { resolveWithDoH, extractIPs } = require("../security/DoH");

const DOOT_CALLER_KEY = process.env.DOOT_CALLER_KEY;

if (!DOOT_CALLER_KEY) {
  throw new Error("Missing DOOT_CALLER_KEY environment variable");
}

function processFloatString(input) {
  const floatValue = parseFloat(input);

  if (isNaN(floatValue)) {
    return "Invalid input";
  }

  const multipliedValue = floatValue * Math.pow(10, MULTIPLICATION_FACTOR);
  const integerValue = Math.floor(multipliedValue);
  const resultString = integerValue.toString();

  return resultString;
}

function getTimestamp(data) {
  const date = new Date(data);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Makes DoH-secured HTTP request
 * 1. Extracts hostname from URL
 * 2. Resolves via DoH to get IP
 * 3. Makes HTTPS request to IP with proper Host header
 */
async function makeDoHSecuredRequest(url, headers = {}) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Resolve hostname via DoH
    const dnsResponse = await resolveWithDoH(hostname, 'A');
    const ips = extractIPs(dnsResponse);

    if (!ips || ips.length === 0) {
      throw new Error(`DoH resolution failed for ${hostname}`);
    }

    const resolvedIP = ips[0];

    // Build URL with IP instead of hostname
    const ipUrl = url.replace(hostname, resolvedIP);

    // Create HTTPS agent with proper SNI
    const httpsAgent = new https.Agent({
      rejectUnauthorized: true,
      servername: hostname, // Important: Set SNI to original hostname
    });

    // Make request to IP with Host header to preserve SNI
    const response = await axios.get(ipUrl, {
      headers: {
        ...headers,
        'Host': hostname,  // Critical: ensures correct TLS certificate validation
      },
      httpsAgent,
      timeout: 15000,
    });

    return response;

  } catch (error) {
    // Fallback to direct axios if DoH fails
    console.warn(`DoH failed for ${url}, falling back to direct request:`, error.message);
    return await axios.get(url, { headers, timeout: 15000 });
  }
}

async function callSignAPICall(url, resultPath, headerName) {
  let API_KEY =
    headerName === "X-CMC_PRO_API_KEY"
      ? process.env.CMC_KEY
      : headerName === "x-messari-api-key"
      ? process.env.MESSARI_KEY
      : headerName === "X-CoinAPI-Key"
      ? process.env.COIN_API_KEY
      : headerName === "x-access-token"
      ? process.env.COIN_RANKING_KEY
      : headerName === "x-api-key"
      ? process.env.SWAP_ZONE_KEY
      : headerName === "Authorization"
      ? `Bearer ${process.env.COIN_CAP_KEY}`
      : "";

  if (typeof API_KEY === "string") {
    API_KEY = API_KEY.replace(/^'(.*)'$/, "$1");
  } else {
    API_KEY = "";
  }

  const headers = headerName ? { [headerName]: API_KEY } : undefined;

  // DoH-secured request
  const response = await makeDoHSecuredRequest(url, headers);

  const price = _.get(response, resultPath);

  let Price;
  if (headerName === "x-api-key") Price = String(price / 1000);
  else Price = String(price);

  const Timestamp = getTimestamp(response.headers["date"]);
  const fieldURL = BigInt(CircuitString.fromString(url).hash());
  const fieldPrice = BigInt(processFloatString(Price));
  const fieldDecimals = BigInt(MULTIPLICATION_FACTOR);
  const fieldTimestamp = BigInt(Timestamp);

  const signature = testnetSignatureClient.signFields(
    [fieldURL, fieldPrice, fieldDecimals, fieldTimestamp],
    DOOT_CALLER_KEY
  );

  const JsonCompatibleSignature = {
    signature: signature.signature,
    publicKey: signature.publicKey,
    data: signature.data[0].toString(),
  };
  return [Price, Timestamp, JsonCompatibleSignature, url];
}

module.exports = { callSignAPICall, processFloatString };
