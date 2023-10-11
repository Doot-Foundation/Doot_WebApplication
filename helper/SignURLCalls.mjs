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

function getSignedAPICall(
  urlCalled,
  price,
  decimals,
  timestamp,
  priceGenerationId
) {
  console.log(privateKey);

  const fieldURL = BigInt(CircuitString.fromString(urlCalled).hash());
  const fieldPrice = BigInt(price);
  const fieldDecimals = BigInt(decimals);
  const fieldTimestamp = BigInt(timestamp);
  const fieldPriceGenerationId = BigInt(priceGenerationId);

  // console.log(
  //   fieldURL,
  //   fieldDecimals,
  //   fieldPrice,
  //   fieldTimestamp,
  //   fieldPriceGenerationId
  // );

  const signature = client.signFields(
    [
      fieldURL,
      fieldPrice,
      fieldDecimals,
      fieldTimestamp,
      fieldPriceGenerationId,
    ],
    privateKey
  );
  console.log(signature);

  return {
    signature: signature.signature,
    publicKey: signature.publicKey,
  };
}

// getSignedAPICall("htts", 123, 234, 234, 1);

export { getSignedAPICall };
