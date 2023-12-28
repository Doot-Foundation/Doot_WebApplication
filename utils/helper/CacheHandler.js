const { TOKEN_TO_CACHE } = require("../constants/info");

const NodeCache = require("node-cache");
const PRICE_CACHE = new NodeCache();

async function updateCache(token, price) {
  const key = TOKEN_TO_CACHE[token];
  PRICE_CACHE.set(key, price);
}

async function getCache(token) {
  const key = TOKEN_TO_CACHE[token] || "NA";
  if (key == "NA") return 0;
  return PRICE_CACHE.get(key);
}

module.exports = { updateCache, getCache };
