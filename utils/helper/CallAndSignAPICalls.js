const axios = require("axios");
const _ = require("lodash");

const ORACLE_KEY = process.env.ORACLE_KEY;

const { signatureClient } = require("./SignatureClient");
const { CircuitString } = require("o1js");

const { MULTIPLICATION_FACTOR } = require("../constants/info");

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
  if (headerName == "x-api-key") Price = String(price / 100);
  else Price = String(price);

  const Timestamp = getTimestamp(response.headers["date"]);

  const fieldURL = BigInt(CircuitString.fromString(url).hash());
  const fieldPrice = BigInt(processFloatString(Price));
  const fieldDecimals = BigInt(MULTIPLICATION_FACTOR);
  const fieldTimestamp = BigInt(Timestamp);

  const signature = signatureClient.signFields(
    [fieldURL, fieldPrice, fieldDecimals, fieldTimestamp],
    ORACLE_KEY
  );

  /// The data field is a BigInt and it gives TypeError: Do not know how to serialize a BigInt
  /// at JSON.stringify (<anonymous>) when passing the final result as the response.
  var JsonCompatibleSignature = {};
  JsonCompatibleSignature["signature"] = signature.signature;
  JsonCompatibleSignature["publicKey"] = signature.publicKey;
  JsonCompatibleSignature["data"] = signature.data[0].toString();
  return [Price, Timestamp, JsonCompatibleSignature, url];
}

module.exports = { callSignAPICall, processFloatString };
