const { Redis } = require("@upstash/redis");

const HOST = process.env.REDIS_REST_HOST;
const PASSWORD = process.env.REDIS_REST_TOKEN;

if (!HOST || !PASSWORD) {
  throw new Error("Missing required Redis environment variables");
}

const redis = new Redis({
  url: HOST,
  token: PASSWORD,
});

module.exports = { redis };
