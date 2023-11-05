const Client = require("mina-signer");
const client = new Client({ network: "testnet" });

const { CircuitString } = require("o1js");

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
  console.log(urlCalled);
  console.log(timestamp);

  const privateKey = process.env.ORACLE_KEY;
  console.log(privateKey);

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
