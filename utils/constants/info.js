const MULTIPLICATION_FACTOR = 10;

const TOKEN_TO_CACHE = {
  ethereum: "eth_cache",
  chainlink: "link_cache",
  solana: "sol_cache",
  mina: "mina_cache",
  bitcoin: "btc_cache",
};
const HISTORICAL_CACHE = "historical_cid";

const DOOT_ADDRESS = "B62qpEYLESLdp52WAJX819GHLrduBzKPVmB2okAXbsELw5dYgVViCWV";

const SUPPORTED_TOKENS = ["MINA", "ETH", "BTC", "LINK", "SOL"];

const TOKEN_TO_SYMBOL = {
  mina: "MINA",
  ethereum: "ETH",
  chainlink: "LINK",
  solana: "SOL",
  bitcoin: "BTC",
};

const SYMBOL_TO_TOKEN = {
  MINA: "mina",
  ETH: "ethereum",
  LINK: "chainlink",
  SOL: "solana",
  BTC: "bitcoin",
};

module.exports = {
  TOKEN_TO_SYMBOL,
  SYMBOL_TO_TOKEN,
  MULTIPLICATION_FACTOR,
  TOKEN_TO_CACHE,
  SUPPORTED_TOKENS,
  DOOT_ADDRESS,
  HISTORICAL_CACHE,
};
