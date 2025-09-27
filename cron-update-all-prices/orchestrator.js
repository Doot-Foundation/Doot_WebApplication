const { updateAllPrices } = require("./src/updateAllPrices");

(async () => {
  try {
    console.log("=== UPDATE-ALL-PRICES JOB STARTED ===");

    const { failed } = await updateAllPrices();

    if (failed.length > 0) {
      console.warn(
        "updateAllPrices completed with failed tokens:",
        failed.join(", ")
      );
    } else {
      console.log("updateAllPrices completed successfully for all tokens");
    }

    console.log("=== UPDATE-ALL-PRICES JOB COMPLETED ===");
    process.exit(0);
  } catch (error) {
    console.error("updateAllPrices job failed:", error.stack || error);
    process.exit(1);
  }
})();
