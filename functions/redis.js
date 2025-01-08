const Redis = require("ioredis");

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  });
}

// Обработка ошибок подключения
redis.on("error", (error) => {
  console.error("Redis Error:", error);
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

module.exports = redis;
