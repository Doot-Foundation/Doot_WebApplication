const axios = require("axios");
const _ = require("lodash");
const { CircuitString } = require("o1js");
const { testnetSignatureClient } = require("./init/InitSignatureClient");
const { MULTIPLICATION_FACTOR } = require("../constants/info");

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

  const response = headers
    ? await axios.get(url, { headers, timeout: 15000 })
    : await axios.get(url, { timeout: 15000 });

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
