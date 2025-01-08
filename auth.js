// Конфигурация OAuth для Яндекса
const yandexConfig = {
  clientID: "ВАШ_CLIENT_ID", // Получите в Яндекс OAuth
  redirectUri: "https://ваш-домен/callback",
  authUrl: "https://oauth.yandex.ru/authorize",
};

// Функция для инициализации авторизации через Яндекс
function initYandexAuth() {
  const authUrl = `${yandexConfig.authUrl}?response_type=token&client_id=${yandexConfig.clientID}&redirect_uri=${yandexConfig.redirectUri}`;
  window.location.href = authUrl;
}

// Обработчик callback от Яндекса
function handleYandexCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");

  if (accessToken) {
    // Получаем информацию о пользователе
    fetch("https://login.yandex.ru/info?format=json", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Здесь обрабатываем данные пользователя
        console.log("Пользователь:", data);
        // Сохраняем данные в вашей системе
        saveUserData(data);
      })
      .catch((error) => console.error("Ошибка:", error));
  }
}

// Добавьте в конец файла
function logout() {
  // Очищаем данные пользователя
  localStorage.removeItem("currentUser");
  // Перенаправляем на страницу входа
  window.location.href = "index.html";
}

// Проверяем авторизацию на защищенных страницах
function checkAuth() {
  const protectedPages = [
    "surveys.html",
    "profile.html",
    "view-survey.html",
    "take-survey.html",
  ];

  const currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage)) {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      window.location.href = "index.html";
    }
  }
}

// Вызываем проверку при загрузке страницы
document.addEventListener("DOMContentLoaded", checkAuth);

// Обработчик формы регистрации по email
document
  .getElementById("emailRegistrationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // Предотвращаем стандартную отправку формы

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Валидация
    if (!username || !email || !password || !confirmPassword) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    // Валидация username
    if (username.length < 3) {
      alert("Имя пользователя должно содержать минимум 3 символа");
      return;
    }

    // Валидация email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      alert("Пожалуйста, введите корректный email");
      return;
    }

    // Валидация пароля
    if (password.length < 6) {
      alert("Пароль должен содержать минимум 6 символов");
      return;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    try {
      console.log("Отправляем запрос на регистрацию:", {
        url: "/.netlify/functions/api/register",
        body: {
          username,
          email,
          password,
        },
      });

      const response = await fetch("/.netlify/functions/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Сохраняем данные пользователя
        localStorage.setItem("userEmail", email);
        localStorage.setItem("username", username);

        // Перенаправляем на страницу выбора роли
        window.location.href = "question.html";
      } else {
        alert(data.message || "Ошибка при регистрации");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка при регистрации");
    }
  });

// Обработчик формы регистрации по коду
document
  .getElementById("codeRegistrationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("code-email").value;
    const code = document.getElementById("auth-code").value;

    try {
      const response = await fetch("/.netlify/functions/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        // Сохраняем email пользователя
        localStorage.setItem("userEmail", email);

        // Перенаправляем на страницу выбора роли
        window.location.href = "question.html";
      } else {
        alert(data.message || "Неверный код");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка при проверке кода");
    }
  });

// Функция отправки кода
async function sendAuthCode() {
  const email = document.getElementById("code-email").value;
  if (!email) {
    alert("Пожалуйста, введите email");
    return;
  }

  try {
    const response = await fetch("/.netlify/functions/api/send-auth-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log("Ответ от сервера при отправке кода:", data);

    if (data.success) {
      document.querySelector(".auth-code-group").style.display = "block";
      alert("Код отправлен на вашу почту");
    } else {
      alert(data.message || "Ошибка отправки кода");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Не удалось отправить код. Попробуйте позже.");
  }
}

// Функции для работы с GitHub OAuth
function initGithubAuth() {
  // GitHub OAuth параметры
  const clientId = "ваш_github_client_id";
  const redirectUri = encodeURIComponent("http://ваш_домен/callback");
  const scope = "user";

  // Формируем URL для авторизации через GitHub
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  // Перенаправляем пользователя на страницу авторизации GitHub
  window.location.href = githubAuthUrl;
}

function showEmailRegistration() {
  document.getElementById("emailRegistrationForm").style.display = "block";
  document.getElementById("codeRegistrationForm").style.display = "none";
  document.querySelector(".auth-methods").style.display = "none";
}

function showCodeRegistration() {
  document.getElementById("codeRegistrationForm").style.display = "block";
  document.getElementById("emailRegistrationForm").style.display = "none";
  document.querySelector(".auth-methods").style.display = "none";
}
