const NodeCache = require("node-cache");
const PRICE_CACHE = new NodeCache();

const TOKEN_TO_CACHE = require("../constants/info");

export function updateCache(token, price) {
  const key = TOKEN_TO_CACHE[token];
  PRICE_CACHE.set(key, price);
}

export function getCache(token) {
  const key = TOKEN_TO_CACHE[token];
  return PRICE_CACHE.get(key);
}
