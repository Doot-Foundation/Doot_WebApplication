const cron = require("node-cron");

function initCronJobs() {
  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  console.log("Initializing cron jobs on port:", port);

  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Running updateAllPrices cron");
    try {
      await fetch(`${baseUrl}/api/update/core/updateAllPrices`, {
        method: "POST",
      });
    } catch (error) {
      console.error("updateAllPrices cron failed:", error);
    }
  });

  // 1-59/20 (at minutes 1, 21, 41)
  cron.schedule("1-59/20 * * * *", async () => {
    console.log("Running updateDootZeko cron");
    try {
      await fetch(`${baseUrl}/api/update/core/updateDootZeko`, {
        method: "POST",
      });
    } catch (error) {
      console.error("updateDootZeko cron failed:", error);
    }
  });

  // 11-59/20 (at minutes 11, 31, 51)
  cron.schedule("11-59/20 * * * *", async () => {
    console.log("Running updateDootMina cron");
    try {
      await fetch(`${baseUrl}/api/update/core/updateDootMina`, {
        method: "POST",
      });
    } catch (error) {
      console.error("updateDootMina cron failed:", error);
    }
  });

  // 5-59/10 (at minutes 5, 15, 25, 35, 45, 55)
  cron.schedule("5-59/10 * * * *", async () => {
    console.log("Running updateHistorical cron");
    try {
      await fetch(`${baseUrl}/api/update/ipfs/updateHistorical`, {
        method: "POST",
      });
    } catch (error) {
      console.error("updateHistorical cron failed:", error);
    }
  });

  console.log("All cron jobs initialized");
}

module.exports = { initCronJobs };
