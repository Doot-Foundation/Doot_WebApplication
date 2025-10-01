const { MULTIPLICATION_FACTOR } = require("./constants/others");
const { COLORS } = require("./constants/others");

function getMAD(array) {
  const median = getMedian(array);
  return getMedian(array.map((value) => Math.abs(value - median)));
}
function getMedian(array) {
  const sorted = array.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getTimestamp(data) {
  const date = new Date(data);
  return Math.floor(date.getTime() / 1000);
}

function processFloatString(input) {
  const floatValue = parseFloat(input);
  if (isNaN(floatValue)) return "Invalid input";
  const multipliedValue = floatValue * Math.pow(10, MULTIPLICATION_FACTOR);
  const integerValue = Math.floor(multipliedValue);
  return integerValue.toString();
}

function logSuccess(message) {
  console.log(`${COLORS.GREEN}[SUCCESS]${COLORS.RESET} ${message}`);
}

function logWarning(message) {
  console.log(`${COLORS.YELLOW}[WARN]${COLORS.RESET} ${message}`);
}

function logError(message) {
  console.log(`${COLORS.RED}[ERROR]${COLORS.RESET} ${message}`);
}

function logInfo(message) {
  console.log(`${COLORS.BLUE}[INFO]${COLORS.RESET} ${message}`);
}

function logAlert(message) {
  console.log(`${COLORS.MAGENTA}[ALERT]${COLORS.RESET} ${message}`);
}

function logHeading(message) {
  console.log(`${COLORS.SUPER_BRIGHT_CYAN}[TITLE]${COLORS.RESET} ${message}`);
}

module.exports = {
  getMAD,
  getMedian,
  getTimestamp,
  processFloatString,
  logSuccess,
  logWarning,
  logError,
  logInfo,
  logAlert,
  logHeading,
};
