const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Тестовое подключение
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Ошибка подключения к PostgreSQL:", err);
  } else {
    console.log(
      "PostgreSQL подключен успешно, время сервера:",
      res.rows[0].now
    );
  }
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
