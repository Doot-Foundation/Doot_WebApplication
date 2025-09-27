const { updateDootZeko } = require("./src/updateDootZeko");

(async () => {
  try {
    console.log("=== UPDATE-DOOT-ZEKO JOB STARTED ===");

    const result = await updateDootZeko();

    if (result.status) {
      console.log("updateDootZeko completed successfully:", result.data);
    } else {
      console.warn("updateDootZeko failed:", result.error, result.data);
    }

    console.log("=== UPDATE-DOOT-ZEKO JOB COMPLETED ===");
    process.exit(result.status ? 0 : 1);
  } catch (error) {
    console.error("updateDootZeko job crashed:", error.stack || error);
    process.exit(1);
  }
})();
