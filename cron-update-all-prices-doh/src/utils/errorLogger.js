const fs = require("fs").promises;
const path = require("path");

const errorLogDir = path.join(__dirname, "..", "errors");
const errorLogFile = path.join(errorLogDir, "log.txt");

const formatDate = () => {
  const now = new Date();
  return now.toISOString();
};

async function ensureErrorDirExists() {
  try {
    await fs.mkdir(errorLogDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create error log directory:", error);
  }
}

async function logErrorToFile(source, errorMessage, errorObj = null) {
  await ensureErrorDirExists();

  const timestamp = formatDate();
  let logEntry = `[${timestamp}] [${source}] ${errorMessage}\n`;

  if (errorObj) {
    logEntry += `Stack: ${errorObj.stack || "No stack trace"}\n`;
  }

  logEntry += "\n[ENTRY] ---------------------------------------------";
  logEntry += "-----------------------------------------------------\n";

  try {
    await fs.appendFile(errorLogFile, logEntry);
  } catch (appendError) {
    console.error("Failed to write to error log file:", appendError);
  }
}

module.exports = {
  logErrorToFile,
};
