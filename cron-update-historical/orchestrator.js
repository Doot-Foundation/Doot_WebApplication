const { updateHistorical } = require("./src/updateHistorical");

(async () => {
  try {
    console.log("=== UPDATE-HISTORICAL JOB STARTED ===");

    const result = await updateHistorical();

    if (result.status) {
      console.log("updateHistorical completed successfully:", result.data);
    } else {
      console.warn("updateHistorical failed:", result.error);
    }

    console.log("=== UPDATE-HISTORICAL JOB COMPLETED ===");
    process.exit(result.status ? 0 : 1);
  } catch (error) {
    console.error("updateHistorical job crashed:", error.stack || error);
    process.exit(1);
  }
})();
