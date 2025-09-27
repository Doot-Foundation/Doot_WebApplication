const { updateDootMina } = require("./src/updateDootMina");

(async () => {
  try {
    console.log("=== UPDATE-DOOT-MINA JOB STARTED ===");

    const result = await updateDootMina();

    if (result.status) {
      console.log("updateDootMina completed successfully:", result.data);
    } else {
      console.warn("updateDootMina failed:", result.error, result.data);
    }

    console.log("=== UPDATE-DOOT-MINA JOB COMPLETED ===");
    process.exit(result.status ? 0 : 1);
  } catch (error) {
    console.error("updateDootMina job crashed:", error.stack || error);
    process.exit(1);
  }
})();
