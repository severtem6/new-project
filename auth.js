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
    "question.html",
    "profile.html",
    "view-survey.html",
    "take-survey.html",
  ];

  const currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage)) {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      window.location.href = "index.html";
    }
  }
}

// Вызываем проверку при загрузке страницы
document.addEventListener("DOMContentLoaded", checkAuth);

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
