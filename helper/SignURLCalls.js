import Client from "mina-signer";
import { CircuitString } from "o1js";

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "..", ".env");
config({ path: envPath });

const client = new Client({ network: "testnet" });
const privateKey = process.env.ORACLE_KEY;

function getSignedAPICall(urlCalled, price, timestamp, priceGenerationId) {
  console.log(privateKey);

  const fieldURL = BigInt(CircuitString.fromString(urlCalled).hash());
  const fieldPrice = BigInt(price);
  const fieldTimestamp = BigInt(timestamp);
  const fieldPriceGenerationId = BigInt(priceGenerationId);

  const signature = client.signFields(
    [
      fieldURL,
      fieldPrice,
      // fieldDecimals,
      fieldTimestamp,
      fieldPriceGenerationId,
    ],
    privateKey
  );
  console.log(signature);

  return signature.signature;
}

export { getSignedAPICall };
