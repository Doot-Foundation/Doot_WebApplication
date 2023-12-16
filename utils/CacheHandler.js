const NodeCache = require("node-cache");
const PRICE_CACHE = new NodeCache();

const TOKEN_TO_CACHE = require("../constants/info");

function updateCache(token, price) {
  const key = TOKEN_TO_CACHE[token];
  PRICE_CACHE.set(key, price);
}

function getCache(token) {
  const key = TOKEN_TO_CACHE[token];
  return PRICE_CACHE.get(key);
}

module.exports = { updateCache, getCache };
