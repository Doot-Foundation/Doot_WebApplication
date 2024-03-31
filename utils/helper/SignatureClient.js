const Client = require("mina-signer");
const signatureClient = new Client({ network: "testnet" });
const mainnetSignatureClient = new Client({ network: "mainnet" });

module.exports = { signatureClient, mainnetSignatureClient };
