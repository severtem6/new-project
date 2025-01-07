const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Хранилище кодов подтверждения
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
});

// Генерация случайного кода
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.handler = async (event) => {
  // Проверяем метод запроса
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" }),
    };
  }

  const body = JSON.parse(event.body);
  const { path } = event;

  // Обработка отправки кода
  if (path === "/.netlify/functions/api/send-auth-code") {
    const { email } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Email не указан",
        }),
      };
    }

    try {
      // Генерируем код
      const verificationCode = generateVerificationCode();
      console.log("Сгенерирован код:", verificationCode);

      // Сохраняем код
      verificationCodes.set(email, {
        code: verificationCode,
        timestamp: Date.now(),
      });

      // Отправляем код на почту
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

      await transporter.sendMail(mailOptions);
      console.log("Письмо отправлено успешно");

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } catch (error) {
      console.error("Ошибка:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка отправки кода: " + error.message,
        }),
      };
    }
  }

  // Обработка проверки кода
  if (path === "/.netlify/functions/api/verify-code") {
    const { email, code } = body;
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Код не найден",
        }),
      };
    }

    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Код устарел",
        }),
      };
    }

    if (storedData.code !== code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Неверный код",
        }),
      };
    }

    verificationCodes.delete(email);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ success: false, message: "Not found" }),
  };
};
