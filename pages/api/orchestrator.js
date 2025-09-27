const runningTasks = new Set();

async function executeTask(taskName, taskFunction) {
  // Skip if already running
  if (runningTasks.has(taskName)) {
    console.log(`[SKIP] ${taskName} is still running from previous cycle`);
    return { skipped: true, reason: "already_running" };
  }

  runningTasks.add(taskName);

  try {
    console.log(`[START] ${taskName} at ${new Date().toISOString()}`);
    const result = await taskFunction();
    console.log(`[DONE] ${taskName} completed successfully`);
    return { success: true, result };
  } catch (error) {
    console.error(`[ERROR] ${taskName} failed:`, error.message);
    return { success: false, error: error.message };
  } finally {
    runningTasks.delete(taskName);
  }
}

function scheduleTask(delayMinutes, taskName, taskFunction) {
  const delayMs = delayMinutes * 60 * 1000;

  setTimeout(async () => {
    await executeTask(taskName, taskFunction);
  }, delayMs);

  console.log(`[SCHEDULED] ${taskName} to run in ${delayMinutes} minutes`);
}

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("\n========== ORCHESTRATOR CYCLE STARTED ==========");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Import your task logic functions
    const { updateAllPricesLogic } = await import(
      "./update/core/updateAllPrices"
    );
    const { updateDootZekoLogic } = await import(
      "./update/core/updateDootZeko"
    );
    const { updateDootMinaLogic } = await import(
      "./update/core/updateDootMina"
    );
    const { updateHistoricalLogic } = await import(
      "./update/ipfs/updateHistorical"
    );

    // Minute 0: Execute updateAllPrices immediately
    executeTask("updateAllPrices_0", updateAllPricesLogic);

    // Schedule remaining tasks
    scheduleTask(1, "updateDootZeko_1", updateDootZekoLogic);
    scheduleTask(5, "updateHistorical_5", updateHistoricalLogic);
    scheduleTask(10, "updateAllPrices_10", updateAllPricesLogic);
    scheduleTask(11, "updateDootMina_11", updateDootMinaLogic);
    scheduleTask(15, "updateHistorical_15", updateHistoricalLogic);

    // Return immediately - don't wait for tasks to complete
    return res.status(200).json({
      status: "orchestrator_started",
      message: "All tasks scheduled successfully",
      schedule: {
        "0min": "updateAllPrices",
        "1min": "updateDootZeko",
        "5min": "updateHistorical",
        "10min": "updateAllPrices",
        "11min": "updateDootMina",
        "15min": "updateHistorical",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Orchestrator failed:", error);
    return res.status(500).json({
      error: "Orchestrator initialization failed",
      details: error.message,
    });
  }
}
