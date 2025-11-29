const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { updateHistorical } = require("./src/updateHistorical");

(async () => {
  try {
    console.log("=== UPDATE-HISTORICAL JOB STARTED ===");

    const result = await updateHistorical();

    if (result.status) {
      console.log("updateHistorical completed successfully:", result.data);
    } else {
      console.warn(
        "updateHistorical encountered an issue (soft fail):",
        result.error
      );
    }

    console.log("=== UPDATE-HISTORICAL JOB COMPLETED ===");
    process.exit(0);
  } catch (error) {
    console.error("updateHistorical job crashed:", error.stack || error);
    process.exit(0);
  }
})();
