const { TOKEN_TO_CACHE } = require("../constants/info");
const NodeCache = require("node-cache");

const ASSET_CACHE = new NodeCache({ stdTTL: 0 });
// The historical cache will be called every 5 minutes and reference the ASSET_CACHE to
// get information about the available assets.

// The tracking cache will be called every 2 hours and reference the ASSET_CACHE to
// get information and upload the information accordingly to Mina contracts and IPFS.\
const HISTORICAL_CACHE = new NodeCache({ stdTTL: 600 });

async function updateAssetCache(token, obj) {
  const key = TOKEN_TO_CACHE[token];
  ASSET_CACHE.set(key, obj);
}

async function getAssetCache(token) {
  const key = TOKEN_TO_CACHE[token] || "NA";
  if (key == "NA") return 0;
  return ASSET_CACHE.get(key);
}

async function updateHistoricalCache(cid) {
  HISTORICAL_CACHE.set("cid", cid);
}

async function getHistoricalCache() {
  return HISTORICAL_CACHE.get("cid");
}

module.exports = {
  updateAssetCache,
  getAssetCache,
  updateHistoricalCache,
  getHistoricalCache,
};
