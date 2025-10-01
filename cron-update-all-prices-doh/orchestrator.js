require("dotenv").config();
const { updateAllPrices } = require("./src/updateAllPrices");
const { initializeCertificateValidation } = require("./src/certificateService");

(async () => {
  try {
    console.log("=== UPDATE-ALL-PRICES JOB STARTED ===");

    // Initialize DoH certificate fingerprints in Redis (first run)
    console.log("Initializing DoH certificate validation...");
    await initializeCertificateValidation();
    console.log("DoH certificate validation initialized\n");

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
