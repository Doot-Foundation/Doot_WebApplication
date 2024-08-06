const axios = require("axios");
const _ = require("lodash");

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;

const {
  signatureClient,
  testnetSignatureClient,
} = require("./SignatureClient");
const { CircuitString } = require("o1js");

const { MULTIPLICATION_FACTOR } = require("../constants/info");

/// MULTIPLY BY 10 AND DROP THE DECIMALS
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

async function callSignAPICall(url, resultPath, headerName) {
  var API_KEY =
    headerName == "X-CMC_PRO_API_KEY"
      ? process.env.CMC_KEY
      : headerName == "X-CoinAPI-Key"
      ? process.env.COIN_API_KEY
      : headerName == "x-access-token"
      ? process.env.COIN_RANKING_KEY
      : headerName == "x-api-key"
      ? process.env.SWAP_ZONE_KEY
      : "";
  API_KEY = API_KEY.replace(/^'(.*)'$/, "$1");

  var header = { [headerName]: API_KEY };

  const response =
    headerName !== ""
      ? await axios.get(url, {
          headers: header,
        })
      : await axios.get(url);

  header = null;

  const price = _.get(response, resultPath);
  var Price;
  if (headerName == "x-api-key") Price = String(price / 1000);
  else Price = String(price);

  const Timestamp = getTimestamp(response.headers["date"]);
  const fieldURL = BigInt(CircuitString.fromString(url).hash());
  const fieldPrice = BigInt(processFloatString(Price));
  const fieldDecimals = BigInt(MULTIPLICATION_FACTOR);
  const fieldTimestamp = BigInt(Timestamp);

  const signature = testnetSignatureClient.signFields(
    [fieldURL, fieldPrice, fieldDecimals, fieldTimestamp],
    DEPLOYER_KEY
  );

  // USED SINCE UNABLE TO TRANSFER BIGINT OVER REST API CALLS.
  var JsonCompatibleSignature = {};
  JsonCompatibleSignature["signature"] = signature.signature;
  JsonCompatibleSignature["publicKey"] = signature.publicKey;
  JsonCompatibleSignature["data"] = signature.data[0].toString();
  return [Price, Timestamp, JsonCompatibleSignature, url];
}

module.exports = { callSignAPICall, processFloatString };
