const HOST = process.env.REDIS_REST_HOST;
const PASSWORD = process.env.REDIS_REST_TOKEN;

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: HOST,
  token: PASSWORD,
});

module.exports = { redis };
