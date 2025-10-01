function logSuccess(message) {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

function logError(message, error = null) {
  console.error(`\x1b[31m${message}\x1b[0m`);
  if (error) console.error(error);
}

function logInfo(message) {
  console.log(`\x1b[36m${message}\x1b[0m`);
}

function logWarn(message) {
  console.log(`\x1b[33m${message}\x1b[0m`);
}

function logHeading(message) {
  console.log(`\x1b[1m${message}\x1b[0m`);
}

module.exports = { logSuccess, logError, logInfo, logWarn, logHeading };
