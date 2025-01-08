const Redis = require("ioredis");

// Создаем подключение к Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  // Для локальной разработки пароль не нужен
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (error) => {
  console.error("Redis Error:", error);
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

module.exports = redis;
