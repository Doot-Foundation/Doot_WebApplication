import {
  CoinGekoSymbols,
  BinanceSymbols,
  CMCSymbols,
  CryptoCompareSymbols,
  CoinAPISymbols,
  PricePaprikeSymbols,
  PriceMessariSymbols,
  CoinCapSymbols,
  CoinLoreSymbols,
  CoinRankingSymbols,
  CoinCodexSymbols,
} from "./symbols";

const MULTIPLICATION_FACTOR = 10;

const TOKEN_TO_CACHE = {
  ethereum: "eth_cache",
  chainlink: "link_cache",
  solana: "sol_cache",
  mina: "mina_cache",
  bitcoin: "btc_cache",
};
const HISTORICAL_CACHE = "historical_cid";
const MINA_CACHE = "mina_cid";

const ORACLE_PUBLIC_KEY =
  "B62qjm48BJuzaZmu2wA5YaZeKknkovbx9kDmu8E83jcYsg4sPgTDgPF";
const DOOT_PUBLIC_KEY =
  "B62qn6RBn2JZTkkagnUhn7EEZTbv4cnTMWyT9w9vEyJgbAbc3TofPSN";

const PROVIDERS = [
  "Binance",
  "CMC",
  "Crypto Compare",
  "Coin API",
  "Coin Paprika",
  "Messari",
  "Coin Cap",
  "Coin Lore",
  "Coin Ranking",
  "Coin Codex",
  "Coin Gecko",
];
const ENDPOINT_TO_DATA_PROVIDER = {
  binance: "Binance",
  coinmarketcap: "CMC",
  cryptocompare: "Crypto Compare",
  coinapi: "Coin API",
  coinpaprika: "Coin Paprika",
  messari: "Messari",
  coincap: "Coin Cap",
  coinlore: "Coin Lore",
  coinranking: "Coin Ranking",
  coincodex: "Coin Codex",
  coingecko: "Coin Gecko",
};
function DATA_PROVIDER_TO_ENDPOINT(provider, token) {
  const binance_id = BinanceSymbols[token.toLowerCase()];
  const ciongecko_id = CoinGekoSymbols[token.toLowerCase()];
  const cmc_id = CMCSymbols[token.toLowerCase()];
  const cryptocompare_id = CryptoCompareSymbols[token.toLowerCase()];
  const coinapi_id = CoinAPISymbols[token.toLowerCase()];
  const pricepaprika_id = PricePaprikeSymbols[token.toLowerCase()];
  const messari_id = PriceMessariSymbols[token.toLowerCase()];
  const coincap_id = CoinCapSymbols[token.toLowerCase()];
  const coinlore_id = CoinLoreSymbols[token.toLowerCase()];
  const coinranking_id = CoinRankingSymbols[token.toLowerCase()];
  const coincodex_id = CoinCodexSymbols[token.toLowerCase()];
  const obj = {
    Binance: `https://api.binance.com/api/v3/ticker/price?symbol=${binance_id}USDT`,
    CMC: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmc_id}&convert=USD`,
    "Crypto Compare": `https://min-api.cryptocompare.com/data/price?fsym=${cryptocompare_id}&tsyms=USD`,
    "Coin API": `https://rest.coinapi.io/v1/exchangerate/${coinapi_id}/USD`,
    "Coin Paprika": `https://api.coinpaprika.com/v1/tickers/${pricepaprika_id}`,
    Messari: `https://data.messari.io/api/v1/assets/${messari_id}/metrics`,
    "Coin Cap": `https://api.coincap.io/v2/assets/${coincap_id}`,
    "Coin Lore": `https://api.coinlore.net/api/ticker/?id=${coinlore_id}`,
    "Coin Ranking": `https://api.coinranking.com/v2/coin/${coinranking_id}/price`,
    "Coin Codex": `https://coincodex.com/api/coincodex/get_coin/${coincodex_id}`,
    "Coin Gecko": `https://api.coingecko.com/api/v3/simple/price?ids=${ciongecko_id}&vs_currencies=usd`,
  };

  return obj[provider];
}

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
  MINA_CACHE,
  SYMBOL_TO_TOKEN,
  MULTIPLICATION_FACTOR,
  PROVIDERS,
  TOKEN_TO_CACHE,
  SUPPORTED_TOKENS,
  DOOT_PUBLIC_KEY,
  ORACLE_PUBLIC_KEY,
  HISTORICAL_CACHE,
  ENDPOINT_TO_DATA_PROVIDER,
  DATA_PROVIDER_TO_ENDPOINT,
};
