const axios = require("axios");
const _ = require("lodash");

const privateKey = process.env.ORACLE_KEY;

const Client = require("mina-signer");
const client = new Client({ network: "testnet" });

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
  const Price = String(price);
  const Timestamp = getTimestamp(response.headers["date"]);

  const fieldURL = BigInt(CircuitString.fromString(url).hash());
  const fieldPrice = BigInt(processFloatString(Price));
  const fieldDecimals = BigInt(MULTIPLICATION_FACTOR);
  const fieldTimestamp = BigInt(Timestamp);
  const fieldPriceGenerationId = BigInt(1);

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

  return [Price, Timestamp, signature.signature];
}

module.exports = { callSignAPICall };
