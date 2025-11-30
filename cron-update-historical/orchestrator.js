const path = require("path");
// Load dotenv if available; fall back to injected env on platforms like Railway
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
} catch (e) {
  console.warn("dotenv not found; relying on platform environment variables");
}
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
