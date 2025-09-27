const { Redis } = require("@upstash/redis");
const { Ratelimit } = require("@upstash/ratelimit");

const HOST = process.env.REDIS_REST_HOST;
const PASSWORD = process.env.REDIS_REST_TOKEN;

if (!HOST || !PASSWORD) {
  throw new Error("Missing required Redis environment variables");
}

const redis = new Redis({
  url: HOST,
  token: PASSWORD,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(6, "60s"),
  prefix: "@upstash/ratelimit",
});

module.exports = { redis, ratelimit };
