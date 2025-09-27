const fetch = require("node-fetch");

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

    const response = await fetch(`${process.env.NEXTJS_URL}${task.endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      timeout: 600000, // 10 minute timeout
    });

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
