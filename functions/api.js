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
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" }),
    };
  }

  const body = JSON.parse(event.body);
  const { path } = event;

  // Обработка регистрации по email (добавляем первым)
  if (path === "/.netlify/functions/api/register") {
    try {
      const { username, email, password } = body;

      // Здесь можно добавить проверку на существующего пользователя
      // и сохранение в базу данных

      console.log("Регистрация нового пользователя:", { username, email });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Регистрация успешна",
          redirect: "/profile.html",
        }),
      };
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при регистрации: " + error.message,
        }),
      };
    }
  }

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

  // Добавьте в существующий файл
  if (path === "/.netlify/functions/api/save-profile") {
    try {
      const { name, age, occupation, interests } = body;

      // Здесь можно добавить сохранение в базу данных
      console.log("Сохранение профиля:", { name, age, occupation, interests });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Профиль успешно сохранен",
        }),
      };
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка сохранения профиля",
        }),
      };
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ success: false, message: "Not found" }),
  };
};
