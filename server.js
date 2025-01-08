require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
const app = express();
const pool = require("./functions/config/postgres");

// Middleware
app.use(cors());
app.use(express.json());

// Хранилище кодов подтверждения (в реальном приложении используйте базу данных)
const verificationCodes = new Map();

// Настройка транспорта для отправки почты
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true,
});

// Проверяем подключение при запуске
console.log("Проверяем настройки SMTP...");
console.log("Email пользователя:", process.env.EMAIL_USER);
console.log("Длина пароля:", process.env.EMAIL_PASS?.length || 0);

transporter.verify(function (error, success) {
  if (error) {
    console.error("=== ОШИБКА ПОДКЛЮЧЕНИЯ К SMTP ===");
    console.error("Тип ошибки:", error.name);
    console.error("Сообщение:", error.message);
    console.error("Код ошибки:", error.code);
    console.error("Стек вызовов:", error.stack);
    if (error.response) console.error("Ответ сервера:", error.response);
  } else {
    console.log("Подключение к SMTP успешно установлено");
  }
});

// Генерация случайного кода
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Endpoint для отправки кода подтверждения
app.post("/api/send-auth-code", async (req, res) => {
  console.log("Получен запрос на отправку кода");
  try {
    const { email } = req.body;
    console.log("Email из запроса:", email);

    if (!email) {
      console.log("Email не указан в запросе");
      return res.status(400).json({
        success: false,
        message: "Email не указан",
      });
    }

    console.log("Начинаем генерацию кода");
    const verificationCode = generateVerificationCode();
    console.log("Сгенерирован код:", verificationCode);

    console.log("Сохраняем код в хранилище");
    verificationCodes.set(email, {
      code: verificationCode,
      timestamp: Date.now(),
    });

    console.log("Подготавливаем письмо");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Код подтверждения регистрации",
      html: `
        <h1>Код подтверждения</h1>
        <p>Ваш код для регистрации: <strong>${verificationCode}</strong></p>
        <p>Код действителен в течение 10 минут.</p>
      `,
    };
    console.log("Настройки письма:", mailOptions);

    console.log("Пытаемся отправить письмо...");
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Письмо успешно отправлено!");
      console.log("ID письма:", info.messageId);
      console.log("Ответ сервера:", info.response);
    } catch (emailError) {
      console.error("Ошибка при отправке письма:");
      console.error("Код ошибки:", emailError.code);
      console.error("Сообщение:", emailError.message);
      console.error("Команда:", emailError.command);
      console.error("Ответ:", emailError.response);
      throw emailError; // Пробрасываем ошибку дальше
    }

    console.log("Отправляем успешный ответ клиенту");
    res.json({ success: true });
  } catch (error) {
    console.error("=== КРИТИЧЕСКАЯ ОШИБКА ===");
    console.error("Тип ошибки:", error.name);
    console.error("Сообщение:", error.message);
    console.error("Стек:", error.stack);
    if (error.code) console.error("Код ошибки:", error.code);
    if (error.response) console.error("Ответ сервера:", error.response);

    res.status(500).json({
      success: false,
      message: "Ошибка отправки кода: " + error.message,
    });
  }
});

// Endpoint для проверки кода
app.post("/api/verify-code", (req, res) => {
  const { email, code } = req.body;

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.json({
      success: false,
      message: "Код не найден",
    });
  }

  // Проверяем время действия кода (10 минут)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(email);
    return res.json({
      success: false,
      message: "Код устарел",
    });
  }

  if (storedData.code !== code) {
    return res.json({
      success: false,
      message: "Неверный код",
    });
  }

  // Код верный, удаляем его из хранилища
  verificationCodes.delete(email);

  res.json({ success: true });
});

// Добавьте обработку ошибок подключения к БД
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

const PORT = process.env.PORT || 5501;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
