const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Перенесите сюда код из server.js, изменив его формат на serverless функции
exports.handler = async (event) => {
  // Обработка запросов
  const { path } = event;
  const body = JSON.parse(event.body);

  if (path === "/.netlify/functions/api/send-auth-code") {
    // Логика отправки кода
    // ...
  }

  if (path === "/.netlify/functions/api/verify-code") {
    // Логика проверки кода
    // ...
  }
};
