const nodemailer = require("nodemailer");
const crypto = require("crypto");
const redis = require("../config/redis");

// В начале файла после импортов добавим тестовый код:
redis.set("test", "Hello Redis!", async (err) => {
  if (err) {
    console.error("Redis Set Error:", err);
  } else {
    const value = await redis.get("test");
    console.log("Redis Test Value:", value);
  }
});

// Хранилище кодов подтверждения
const verificationCodes = new Map();

// Настройка транспорта для отправки почты
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Добавим проверку подключения
transporter.verify(function (error, success) {
  if (error) {
    console.error("Ошибка подключения к почтовому серверу:", error);
  } else {
    console.log("Сервер готов к отправке сообщений");
  }
});

// Генерация случайного кода
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.handler = async (event) => {
  const { path } = event;

  // Изменим проверку метода для эндпоинта debug/redis-data
  if (path === "/.netlify/functions/api/debug/redis-data") {
    // Разрешаем GET запросы для этого эндпоинта
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: "Method not allowed" }),
      };
    }

    try {
      // Получаем все ключи
      const keys = await redis.keys("*");
      const data = {};

      // Для каждого ключа получаем его значение
      for (const key of keys) {
        // Проверяем тип данных для ключа
        const type = await redis.type(key);

        switch (type) {
          case "hash":
            data[key] = await redis.hgetall(key);
            break;
          case "set":
            data[key] = await redis.smembers(key);
            break;
          case "string":
            data[key] = await redis.get(key);
            break;
          default:
            data[key] = `Неподдерживаемый тип: ${type}`;
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            success: true,
            data: data,
          },
          null,
          2
        ),
      };
    } catch (error) {
      console.error("Ошибка получения данных Redis:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка получения данных: " + error.message,
        }),
      };
    }
  }

  // Для всех остальных эндпоинтов оставляем только POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" }),
    };
  }

  // Парсим тело запроса только для POST запросов
  const body = JSON.parse(event.body);

  // Обработка регистрации
  if (path === "/.netlify/functions/api/register") {
    try {
      const { username, email, password } = body;

      // Проверяем, существует ли пользователь
      const existingUser = await redis.hget("users", email);
      if (existingUser) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Пользователь с таким email уже существует",
          }),
        };
      }

      // Хешируем пароль
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      // Сохраняем пользователя
      const user = {
        username,
        email,
        password: hashedPassword,
        createdAt: Date.now(),
      };

      await redis.hset("users", email, JSON.stringify(user));

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Регистрация успешна",
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
    try {
      const { email } = body;
      console.log("Отправка кода на email:", email);

      const code = generateVerificationCode();
      console.log("Сгенерирован код:", code);

      // Сохраняем код в Redis
      await redis.set(`verification:${email}`, code, "EX", 600);
      console.log("Код сохранен в Redis");

      // Настраиваем письмо
      const mailOptions = {
        from: `"Система опросов" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Код подтверждения регистрации",
        html: `
          <h1>Код подтверждения</h1>
          <p>Ваш код для регистрации: <strong>${code}</strong></p>
          <p>Код действителен в течение 10 минут.</p>
        `,
      };

      console.log("Отправка письма...");
      await transporter.sendMail(mailOptions);
      console.log("Письмо успешно отправлено");

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Код успешно отправлен",
        }),
      };
    } catch (error) {
      console.error("Подробная ошибка отправки кода:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка отправки кода: " + error.message,
        }),
      };
    }
  }

  // Проверка кода подтверждения
  if (path === "/.netlify/functions/api/verify-code") {
    try {
      const { email, code } = body;
      console.log("Проверка кода для:", email);

      // Получаем код из Redis
      const storedCode = await redis.get(`verification:${email}`);
      if (!storedCode) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Код не найден или устарел",
          }),
        };
      }

      if (storedCode !== code) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Неверный код",
          }),
        };
      }

      // Удаляем использованный код
      await redis.del(`verification:${email}`);

      // Создаем нового пользователя
      const user = {
        email,
        createdAt: Date.now(),
      };

      // Сохраняем пользователя в Redis
      await redis.hset("users", email, JSON.stringify(user));

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Регистрация успешна",
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

  // Создание опроса
  if (path === "/.netlify/functions/api/create-survey") {
    try {
      console.log("Получены данные:", body);
      const { title, description, questions, authorEmail } = body;

      // Проверяем все обязательные поля
      if (!title) {
        console.error("Отсутствует название опроса");
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Название опроса обязательно",
          }),
        };
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.error("Отсутствуют вопросы или неверный формат");
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Добавьте хотя бы один вопрос",
          }),
        };
      }

      if (!authorEmail) {
        console.error("Отсутствует email автора");
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Email автора обязателен",
          }),
        };
      }

      // Генерируем уникальный ID для опроса
      const surveyId = crypto.randomUUID();
      console.log("Создан ID опроса:", surveyId);

      // Создаем объект опроса
      const survey = {
        id: surveyId,
        title,
        description: description || "Новый опрос",
        questions,
        authorEmail,
        createdAt: Date.now(),
      };

      console.log("Подготовлен объект опроса:", survey);

      try {
        // Сохраняем опрос в Redis
        await redis.hset("surveys", surveyId, JSON.stringify(survey));
        console.log("Опрос сохранен в Redis");

        // Добавляем ID опроса в список опросов пользователя
        await redis.sadd(`user:${authorEmail}:surveys`, surveyId);
        console.log("ID опроса добавлен в список пользователя");

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Опрос успешно создан",
            surveyId,
          }),
        };
      } catch (redisError) {
        console.error("Ошибка Redis:", redisError);
        throw redisError;
      }
    } catch (error) {
      console.error("Ошибка создания опроса:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при создании опроса: " + error.message,
        }),
      };
    }
  }

  // Получение списка опросов пользователя
  if (path === "/.netlify/functions/api/get-user-surveys") {
    try {
      const { email } = body;

      // Получаем ID всех опросов пользователя
      const surveyIds = await redis.smembers(`user:${email}:surveys`);
      const surveys = [];

      // Получаем данные каждого опроса
      for (const id of surveyIds) {
        const surveyData = await redis.hget("surveys", id);
        if (surveyData) {
          surveys.push(JSON.parse(surveyData));
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          surveys,
        }),
      };
    } catch (error) {
      console.error("Ошибка получения опросов:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка получения опросов: " + error.message,
        }),
      };
    }
  }

  // Сохранение ответов на опрос
  if (path === "/.netlify/functions/api/submit-survey") {
    try {
      const { surveyId, answers, respondentEmail } = body;

      const responseId = crypto.randomUUID();
      const response = {
        id: responseId,
        surveyId,
        answers,
        respondentEmail,
        submittedAt: Date.now(),
      };

      // Сохраняем ответы
      await redis.hset(
        `survey:${surveyId}:responses`,
        responseId,
        JSON.stringify(response)
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Ответы сохранены",
        }),
      };
    } catch (error) {
      console.error("Ошибка сохранения ответов:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка сохранения ответов: " + error.message,
        }),
      };
    }
  }

  // Удаление опроса
  if (path === "/.netlify/functions/api/delete-survey") {
    try {
      const { surveyId, authorEmail } = body;

      // Проверяем, существует ли опрос
      const survey = await redis.hget("surveys", surveyId);
      if (!survey) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: "Опрос не найден",
          }),
        };
      }

      // Удаляем опрос из общего списка
      await redis.hdel("surveys", surveyId);

      // Удаляем из списка опросов пользователя
      await redis.srem(`user:${authorEmail}:surveys`, surveyId);

      // Удаляем все ответы на опрос
      await redis.del(`survey:${surveyId}:responses`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Опрос успешно удален",
        }),
      };
    } catch (error) {
      console.error("Ошибка удаления опроса:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка удаления опроса: " + error.message,
        }),
      };
    }
  }

  // Получение пройденных опросов
  if (path === "/.netlify/functions/api/get-completed-surveys") {
    try {
      const { email } = body;
      const surveys = [];

      // Получаем все опросы
      const allSurveys = await redis.hgetall("surveys");

      // Проверяем каждый опрос на наличие ответов от пользователя
      for (const [surveyId, surveyData] of Object.entries(allSurveys)) {
        const responses = await redis.hgetall(`survey:${surveyId}:responses`);

        // Если пользователь отвечал на этот опрос
        if (
          Object.values(responses).some(
            (response) => JSON.parse(response).respondentEmail === email
          )
        ) {
          surveys.push(JSON.parse(surveyData));
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          surveys,
        }),
      };
    } catch (error) {
      console.error("Ошибка получения пройденных опросов:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка получения пройденных опросов: " + error.message,
        }),
      };
    }
  }

  // Получение конкретного опроса
  if (path === "/.netlify/functions/api/get-survey") {
    try {
      const surveyId = event.path.split("/").pop(); // Получаем ID из URL
      const surveyData = await redis.hget("surveys", surveyId);

      if (!surveyData) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: "Опрос не найден",
          }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          survey: JSON.parse(surveyData),
        }),
      };
    } catch (error) {
      console.error("Ошибка получения опроса:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при получении опроса: " + error.message,
        }),
      };
    }
  }

  // Добавление ученика к преподавателю
  if (path === "/.netlify/functions/api/add-student") {
    try {
      const { teacherEmail, studentEmail } = body;

      // Проверяем существование ученика
      const studentExists = await redis.hget("users", studentEmail);
      if (!studentExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: "Ученик с таким email не найден",
          }),
        };
      }

      // Добавляем ученика к преподавателю
      await redis.sadd(`teacher:${teacherEmail}:students`, studentEmail);
      // Добавляем преподавателя к ученику
      await redis.sadd(`student:${studentEmail}:teachers`, teacherEmail);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Ученик успешно добавлен",
        }),
      };
    } catch (error) {
      console.error("Ошибка добавления ученика:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при добавлении ученика: " + error.message,
        }),
      };
    }
  }

  // Получение списка учеников преподавателя
  if (path === "/.netlify/functions/api/get-students") {
    try {
      const { teacherEmail } = body;
      const studentEmails = await redis.smembers(
        `teacher:${teacherEmail}:students`
      );
      const students = [];

      // Получаем информацию о каждом ученике
      for (const email of studentEmails) {
        const studentData = await redis.hget("users", email);
        if (studentData) {
          const student = JSON.parse(studentData);
          // Не отправляем пароль
          delete student.password;
          students.push(student);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          students,
        }),
      };
    } catch (error) {
      console.error("Ошибка получения списка учеников:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при получении списка учеников: " + error.message,
        }),
      };
    }
  }

  // Получение доступных опросов для ученика
  if (path === "/.netlify/functions/api/get-available-surveys") {
    try {
      const { email } = body;

      // Получаем список преподавателей ученика
      const teacherEmails = await redis.smembers(`student:${email}:teachers`);
      const availableSurveys = [];

      // Получаем опросы каждого преподавателя
      for (const teacherEmail of teacherEmails) {
        const surveyIds = await redis.smembers(`user:${teacherEmail}:surveys`);
        for (const id of surveyIds) {
          const surveyData = await redis.hget("surveys", id);
          if (surveyData) {
            availableSurveys.push(JSON.parse(surveyData));
          }
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          surveys: availableSurveys,
        }),
      };
    } catch (error) {
      console.error("Ошибка получения доступных опросов:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при получении доступных опросов: " + error.message,
        }),
      };
    }
  }

  // Получение всех пользователей (для админа)
  if (path === "/.netlify/functions/api/get-users") {
    try {
      const users = await redis.hgetall("users");
      const usersList = Object.values(users).map((userData) => {
        const user = JSON.parse(userData);
        // Не отправляем пароли
        delete user.password;
        return user;
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          users: usersList,
        }),
      };
    } catch (error) {
      console.error("Ошибка получения пользователей:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Ошибка при получении пользователей: " + error.message,
        }),
      };
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ success: false, message: "Not found" }),
  };
};
