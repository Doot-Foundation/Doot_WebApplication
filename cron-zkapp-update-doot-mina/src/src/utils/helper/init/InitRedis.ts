import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const HOST = process.env.REDIS_REST_HOST;
const PASSWORD = process.env.REDIS_REST_TOKEN;

if (!HOST || !PASSWORD) {
  throw new Error("Missing required Redis environment variables");
}

export const redis = new Redis({
  url: HOST,
  token: PASSWORD,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(6, "60s"),
  prefix: "@upstash/ratelimit",
});