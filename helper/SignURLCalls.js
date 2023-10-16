const Client = require("mina-signer");
const { CircuitString } = require("o1js");

const { config } = require("dotenv");
const { resolve, dirname } = require("path");
const { fileURLToPath } = require("url");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "..", ".env");
config({ path: envPath });

const client = new Client({ network: "testnet" });
const privateKey = process.env.ORACLE_KEY;

const { MULTIPLICATION_FACTOR } = require("../constants/info");

function processFloatString(input) {
  const floatValue = parseFloat(input);

  // Check if the input is a valid float
  if (isNaN(floatValue)) {
    return "Invalid input";
  }

  const multipliedValue = floatValue * Math.pow(10, MULTIPLICATION_FACTOR);
  const integerValue = Math.floor(multipliedValue);
  const resultString = integerValue.toString();

  return resultString;
}

function getSignedAPICall(urlCalled, price, timestamp, priceGenerationId) {
  console.log(price);

  const fieldURL = BigInt(CircuitString.fromString(urlCalled).hash());
  const fieldPrice = BigInt(processFloatString(price));
  const fieldDecimals = BigInt(MULTIPLICATION_FACTOR);
  const fieldTimestamp = BigInt(timestamp);
  const fieldPriceGenerationId = BigInt(priceGenerationId);

  const signature = client.signFields(
    [
      fieldURL,
      fieldPrice,
      fieldDecimals,
      fieldTimestamp,
      fieldPriceGenerationId,
    ],
    privateKey
  );
  console.log(signature);

  return signature.signature;
}

module.exports = { getSignedAPICall };
