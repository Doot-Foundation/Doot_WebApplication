const {
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
  KuCoinSymbols,
  HuobiSymbols,
  ByBitSymbols,
  CexIOSymbols,
  MEXCSymbols,
  GateIOSymbols,
  OKXSymbols,
  PoloniexSymbols,
  BTSESymbols,
} = require("./symbols");

const MULTIPLICATION_FACTOR = 10;

const HISTORICAL_CID_CACHE = "historical_cid";
const MINA_CID_CACHE = "mina_cid";
const ZEKO_CID_CACHE = "zeko_cid";

const TOKEN_TO_AGGREGATION_PROOF_CACHE = {
  mina: "mina_aggregation_cache",
  bitcoin: "btc_aggregation_cache",
  ethereum: "eth_aggregation_cache",
  solana: "sol_aggregation_cache",
  ripple: "xrp_aggregation_cache",
  cardano: "ada_aggregation_cache",
  avalanche: "avax_aggregation_cache",
  polygon: "matic_aggregation_cache",
  chainlink: "link_aggregation_cache",
  dogecoin: "doge_aggregation_cache",
};

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

const TOKEN_TO_GRAPH_DATA = {
  mina: "mina_graph_cache",
  bitcoin: "btc_graph_cache",
  ethereum: "eth_graph_cache",
  solana: "sol_graph_cache",
  ripple: "xrp_graph_cache",
  cardano: "ada_graph_cache",
  avalanche: "avax_graph_cache",
  polygon: "matic_graph_cache",
  chainlink: "link_graph_cache",
  dogecoin: "doge_graph_cache",
};

const PROVIDERS = [
  "Binance",
  "Coin Cap",
  "Coin Gecko",
  "CoinMarketCap",
  "Crypto Compare",
  "CoinAPI",
  "Coin Paprika",
  "Messari",
  "Coin Codex",
  "Coin Lore",
  "Coin Ranking",
  "KuCoin",
  "Huobi",
  "ByBit",
  "Cex.io",
  "MEXC",
  "Gate.io",
  "OKX",
  "Poloniex",
  "BTSE",
];

const ENDPOINT_TO_DATA_PROVIDER = {
  binance: "Binance",
  coincap: "Coin Cap",
  coingecko: "Coin Gecko",
  "pro-api.coinmarketcap": "CoinMarketCap",
  cryptocompare: "Crypto Compare",
  "rest.coinapi.io": "CoinAPI",
  coinpaprika: "Coin Paprika",
  messari: "Messari",
  coincodex: "Coin Codex",
  coinlore: "Coin Lore",
  coinranking: "Coin Ranking",
  kucoin: "KuCoin",
  huobi: "Huobi",
  bybit: "ByBit",
  "cex.io": "Cex.io",
  mexc: "MEXC",
  gateio: "Gate.io",
  okx: "OKX",
  poloniex: "Poloniex",
  btse: "BTSE",
};

function DATA_PROVIDER_TO_ENDPOINT(provider, token) {
  const binance_id = BinanceSymbols[token.toLowerCase()];
  const coingecko_id = CoinGekoSymbols[token.toLowerCase()];
  const cmc_id = CMCSymbols[token.toLowerCase()];
  const cryptocompare_id = CryptoCompareSymbols[token.toLowerCase()];
  const coinapi_id = CoinAPISymbols[token.toLowerCase()];
  const pricepaprika_id = PricePaprikeSymbols[token.toLowerCase()];
  const messari_id = PriceMessariSymbols[token.toLowerCase()];
  const coincap_id = CoinCapSymbols[token.toLowerCase()];
  const coinlore_id = CoinLoreSymbols[token.toLowerCase()];
  const coinranking_id = CoinRankingSymbols[token.toLowerCase()];
  const coincodex_id = CoinCodexSymbols[token.toLowerCase()];
  const kucoin_id = KuCoinSymbols[token.toLowerCase()];
  const huobi_id = HuobiSymbols[token.toLowerCase()];
  const bybit_id = ByBitSymbols[token.toLowerCase()];
  const cexio_id = CexIOSymbols[token.toLowerCase()];
  const mexc_id = MEXCSymbols[token.toLowerCase()];
  const gateio_id = GateIOSymbols[token.toLowerCase()];
  const okx_id = OKXSymbols[token.toLowerCase()];
  const poloniex_id = PoloniexSymbols[token.toLowerCase()];
  const btse_id = BTSESymbols[token.toLowerCase()];

  const obj = {
    Binance: `https://api.binance.com/api/v3/ticker/price?symbol=${binance_id}USDT`,
    "Coin Cap": `https://rest.coincap.io/v3/price/bysymbol/${coincap_id}`,
    "Coin Gecko": `https://api.coingecko.com/api/v3/simple/price?ids=${coingecko_id}&vs_currencies=usd`,
    CoinMarketCap: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmc_id}&convert=USD`,
    "Crypto Compare": `https://min-api.cryptocompare.com/data/price?fsym=${cryptocompare_id}&tsyms=USD`,
    CoinAPI: `https://rest.coinapi.io/v1/exchangerate/${coinapi_id}/USD`,
    "Coin Paprika": `https://api.coinpaprika.com/v1/tickers/${pricepaprika_id}`,
    Messari: `https://api.messari.io/metrics/v2/assets/details?slugs=${messari_id}`,
    "Coin Codex": `https://coincodex.com/api/coincodex/get_coin/${coincodex_id}`,
    "Coin Lore": `https://api.coinlore.net/api/ticker/?id=${coinlore_id}`,
    "Coin Ranking": `https://api.coinranking.com/v2/coin/${coinranking_id}/price`,
    KuCoin: `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kucoin_id}-USDT`,
    Huobi: `https://api.huobi.pro/market/history/trade?symbol=${huobi_id}usdt&size=1`,
    ByBit: `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybit_id}USDT`,
    "Cex.io": `https://cex.io/api/last_price/${cexio_id}/USD`,
    MEXC: `https://api.mexc.com/api/v3/ticker/price?symbol=${mexc_id}USDT`,
    "Gate.io": `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gateio_id}_USDT`,
    OKX: `https://www.okx.com/api/v5/market/ticker?instId=${okx_id}-USDT`,
    Poloniex: `https://api.poloniex.com/markets/${poloniex_id}_USDT/price`,
    BTSE: `https://api.btse.com/spot/api/v3.2/price?symbol=${btse_id}-USD`,
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
  MULTIPLICATION_FACTOR,
  HISTORICAL_CID_CACHE,
  MINA_CID_CACHE,
  ZEKO_CID_CACHE,
  TOKEN_TO_AGGREGATION_PROOF_CACHE,
  TOKEN_TO_CACHE,
  TOKEN_TO_GRAPH_DATA,
  PROVIDERS,
  ENDPOINT_TO_DATA_PROVIDER,
  DATA_PROVIDER_TO_ENDPOINT,
  SUPPORTED_TOKENS,
  TOKEN_TO_SYMBOL,
  SYMBOL_TO_TOKEN,
};
