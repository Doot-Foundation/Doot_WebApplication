const Client = require("mina-signer");
const testnetSignatureClient = new Client({ network: "testnet" });
const mainnetSignatureClient = new Client({ network: "mainnet" });

module.exports = { testnetSignatureClient, mainnetSignatureClient };
