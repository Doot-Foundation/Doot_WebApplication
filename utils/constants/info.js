import {
  CoinGekoSymbols,
  BinanceSymbols,
  CryptoCompareSymbols,
  PricePaprikeSymbols,
  PriceMessariSymbols,
  CoinCapSymbols,
  CoinLoreSymbols,
  CoinCodexSymbols,
  KuCoinSymbols,
  HuobiSymbols,
  ByBitSymbols,
  CexIOSymbols,
  SwapZoneSymbols,
} from "./symbols";

const MULTIPLICATION_FACTOR = 10;

const TOKEN_TO_CACHE = {
  mina: "mina_cache",
  bitcoin: "btc_cache",
  ethereum: "eth_cache",
  solana: "sol_cache",
  ripple: "xrp_cache",
  cardano: "ada_cache",
  avalanche: "avax_cache",
  polygon: "matic_cache",
  chainlink: "link_cache",
  dogecoin: "doge_cache",
};
const TOKEN_TO_SIGNED_SLOT = {
  mina: "mina_latest_slot_cache",
  bitcoin: "btc_latest_slot_cache",
  ethereum: "eth_latest_slot_cache",
  solana: "sol_latest_slot_cache",
  ripple: "xrp_latest_slot_cache",
  cardano: "ada_latest_slot_cache",
  avalanche: "avax_latest_slot_cache",
  polygon: "matic_latest_slot_cache",
  chainlink: "link_latest_slot_cache",
  dogecoin: "doge_latest_slot_cache",
};

const HISTORICAL_CACHE = "historical_cid";
const MINA_CACHE = "mina_cid";
const HISTORICAL_SIGNED_MAX_CACHE = "historical_signed_max";
const MINA_SIGNED_MAX_CACHE = "mina_signed_max";

const SLOT_STATUS_CACHE = "slot_logic_allowed";

const ORACLE_PUBLIC_KEY =
  "B62qjm48BJuzaZmu2wA5YaZeKknkovbx9kDmu8E83jcYsg4sPgTDgPF";
const DOOT_PUBLIC_KEY =
  "B62qjaQEw1PcdETvJyLMtKxYgz8GAXv3cGeJ575Cgf3Hpw5qybr1jFE";

const PROVIDERS = [
  "Binance",
  "Crypto Compare",
  "Coin Paprika",
  "Messari",
  "Coin Cap",
  "Coin Lore",
  "Coin Codex",
  "Coin Gecko",
  "KuCoin",
  "Huobi",
  "ByBit",
  "Cex.io",
  "SwapZone",
];
const ENDPOINT_TO_DATA_PROVIDER = {
  binance: "Binance",
  cryptocompare: "Crypto Compare",
  coinpaprika: "Coin Paprika",
  messari: "Messari",
  coincap: "Coin Cap",
  coinlore: "Coin Lore",
  coincodex: "Coin Codex",
  coingecko: "Coin Gecko",
  kucoin: "KuCoin",
  huobi: "Huobi",
  bybit: "ByBit",
  "cex.io": "Cex.io",
  swapzone: "Swapzone",
};
function DATA_PROVIDER_TO_ENDPOINT(provider, token) {
  const binance_id = BinanceSymbols[token.toLowerCase()];
  const ciongecko_id = CoinGekoSymbols[token.toLowerCase()];
  const cryptocompare_id = CryptoCompareSymbols[token.toLowerCase()];
  const pricepaprika_id = PricePaprikeSymbols[token.toLowerCase()];
  const messari_id = PriceMessariSymbols[token.toLowerCase()];
  const coincap_id = CoinCapSymbols[token.toLowerCase()];
  const coinlore_id = CoinLoreSymbols[token.toLowerCase()];
  const coincodex_id = CoinCodexSymbols[token.toLowerCase()];
  const kucoin_id = KuCoinSymbols[token.toLowerCase()];
  const huobi_id = HuobiSymbols[token.toLowerCase()];
  const bybit_id = ByBitSymbols[token.toLowerCase()];
  const cexio_id = CexIOSymbols[token.toLowerCase()];
  const swapzone_id = SwapZoneSymbols[token.toLowerCase()];
  const obj = {
    Binance: `https://api.binance.com/api/v3/ticker/price?symbol=${binance_id}USDT`,
    "Crypto Compare": `https://min-api.cryptocompare.com/data/price?fsym=${cryptocompare_id}&tsyms=USD`,
    "Coin Paprika": `https://api.coinpaprika.com/v1/tickers/${pricepaprika_id}`,
    Messari: `https://data.messari.io/api/v1/assets/${messari_id}/metrics`,
    "Coin Cap": `https://api.coincap.io/v2/assets/${coincap_id}`,
    "Coin Lore": `https://api.coinlore.net/api/ticker/?id=${coinlore_id}`,
    "Coin Codex": `https://coincodex.com/api/coincodex/get_coin/${coincodex_id}`,
    "Coin Gecko": `https://api.coingecko.com/api/v3/simple/price?ids=${ciongecko_id}&vs_currencies=usd`,
    KuCoin: `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kucoin_id}-USDT`,
    Huobi: `https://api.huobi.pro/market/history/trade?symbol=${huobi_id}usdt&size=1`,
    ByBit: `https://api.bybit.com/derivatives/v3/public/tickers?symbol=${bybit_id}USDT`,
    "Cex.io": `https://cex.io/api/last_price/${cexio_id}/USD`,
    SwapZone: `https://api.swapzone.io/v1/exchange/get-rate?from=${swapzone_id}&to=usdc&amount=1000`,
  };

  return obj[provider];
}

const SUPPORTED_TOKENS = [
  "MINA",
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "ADA",
  "AVAX",
  "MATIC",
  "LINK",
  "DOGE",
];
const TOKEN_TO_SYMBOL = {
  mina: "MINA",
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  ripple: "XRP",
  avalanche: "AVAX",
  cardano: "ADA",
  polygon: "MATIC",
  chainlink: "LINK",
  dogecoin: "DOGE",
};
const SYMBOL_TO_TOKEN = {
  MINA: "mina",
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  AVAX: "avalanche",
  ADA: "cardano",
  MATIC: "polygon",
  LINK: "chainlink",
  DOGE: "dogecoin",
};

module.exports = {
  DOOT_PUBLIC_KEY,
  TOKEN_TO_SYMBOL,
  TOKEN_TO_SIGNED_SLOT,
  HISTORICAL_CACHE,
  MINA_CACHE,
  HISTORICAL_SIGNED_MAX_CACHE,
  MINA_SIGNED_MAX_CACHE,
  SYMBOL_TO_TOKEN,
  MULTIPLICATION_FACTOR,
  PROVIDERS,
  TOKEN_TO_CACHE,
  SLOT_STATUS_CACHE,
  SUPPORTED_TOKENS,
  ORACLE_PUBLIC_KEY,
  ENDPOINT_TO_DATA_PROVIDER,
  DATA_PROVIDER_TO_ENDPOINT,
};
