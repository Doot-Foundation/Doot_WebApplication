const Redis = require("ioredis");

const HOST = process.env.REDIS_HOST;
const PASSWORD = process.env.REDIS_PASSWORD;
const PORT = process.env.REDIS_PORT;

const redis = new Redis({
  host: HOST,
  port: PORT,
  password: PASSWORD,
});

module.exports = { redis };
