const Client = require("mina-signer");
const signatureClient = new Client({ network: "testnet" });

module.exports = { signatureClient };
