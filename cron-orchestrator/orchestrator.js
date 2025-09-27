const fetch = require("node-fetch");
const https = require("https");
const fs = require("fs");

const httpsAgent = createHttpsAgent();
const agentOption = httpsAgent
  ? (parsedURL) => (parsedURL.protocol === "https:" ? httpsAgent : undefined)
  : undefined;

function createHttpsAgent() {
  const allowInsecure =
    (process.env.CRON_ALLOW_INSECURE_SSL || "").toLowerCase() === "true";
  const caBundlePath = process.env.CRON_CA_BUNDLE_PATH;
  const caBundle = process.env.CRON_CA_BUNDLE;

  if (caBundlePath) {
    try {
      const ca = fs.readFileSync(caBundlePath, "utf8");
      console.log(`[TLS] Using CA bundle from ${caBundlePath}`);
      return new https.Agent({ keepAlive: true, ca });
    } catch (error) {
      console.error(
        `[TLS] Failed to read CA bundle at ${caBundlePath}:`,
        error.message
      );
    }
  }

  if (caBundle) {
    console.log("[TLS] Using inline CA bundle from CRON_CA_BUNDLE");
    return new https.Agent({ keepAlive: true, ca: caBundle });
  }

  if (allowInsecure) {
    console.warn(
      "[TLS] CRON_ALLOW_INSECURE_SSL=true – TLS certificate validation disabled"
    );
    return new https.Agent({ keepAlive: true, rejectUnauthorized: false });
  }

  return undefined;
}

const TASKS = [
  {
    minute: 0,
    endpoint: "/api/update/core/updateAllPrices",
    name: "updateAllPrices",
  },
  {
    minute: 1,
    endpoint: "/api/update/core/updateDootZeko",
    name: "updateDootZeko",
  },
  {
    minute: 5,
    endpoint: "/api/update/ipfs/updateHistorical",
    name: "updateHistorical",
  },
  {
    minute: 10,
    endpoint: "/api/update/core/updateAllPrices",
    name: "updateAllPrices",
  },
  {
    minute: 11,
    endpoint: "/api/update/core/updateDootMina",
    name: "updateDootMina",
  },
  {
    minute: 15,
    endpoint: "/api/update/ipfs/updateHistorical",
    name: "updateHistorical",
  },
];

async function executeTask(task) {
  try {
    console.log(`[${new Date().toISOString()}] Starting ${task.name}`);

    const fetchOptions = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      timeout: 600000, // 10 minute timeout
    };

    if (agentOption) {
      fetchOptions.agent = agentOption;
    }

    const response = await fetch(
      `${process.env.NEXTJS_URL}${task.endpoint}`,
      fetchOptions
    );

    const result = await response.json();
    console.log(`[${task.name}] Completed:`, result.message || "Success");
  } catch (error) {
    console.error(`[${task.name}] Failed:`, error.message);
  }
}

async function runOrchestrator() {
  console.log("=== ORCHESTRATOR STARTED ===");

  // Schedule all tasks with delays
  const promises = TASKS.map(
    (task) =>
      new Promise((resolve) => {
        setTimeout(async () => {
          await executeTask(task);
          resolve();
        }, task.minute * 60 * 1000);
      })
  );

  // Wait for all tasks to complete (max 20 minutes)
  await Promise.all(promises);

  console.log("=== ORCHESTRATOR COMPLETED ===");
  process.exit(0); // CRITICAL: Must exit for Railway
}

runOrchestrator();
