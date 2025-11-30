import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Load environment variables FIRST - before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = resolve(__dirname, '..', '..'); // cron package root
// Load only this package's env files
[join(pkgRoot, '.env.local'), join(pkgRoot, '.env')].forEach((p) =>
  config({ path: p, override: true })
);

// Now import modules that depend on environment variables
const { updateDootMina } = await import("./updateDootMina.js");

async function main() {
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
    console.error("updateDootMina job crashed:", error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  }
}

main();
