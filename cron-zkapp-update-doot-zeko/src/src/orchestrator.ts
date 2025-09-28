import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables FIRST - before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
config({ path: join(projectRoot, '.env') });

// Now import modules that depend on environment variables
const { updateDootZeko } = await import("./updateDootZeko.js");

async function main() {
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
    console.error("updateDootZeko job crashed:", error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  }
}

main();