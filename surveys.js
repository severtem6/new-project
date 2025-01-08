document.addEventListener("DOMContentLoaded", async () => {
  const surveysList = document.getElementById("surveys-list");
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  // Загрузка опросов
  async function loadSurveys() {
    try {
      console.log("Загрузка опросов для:", userEmail);
      const response = await fetch("/.netlify/functions/api/get-user-surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      console.log("Полученные опросы:", data);

      if (data.success) {
        displaySurveys(data.surveys);
      } else {
        console.error("Ошибка получения опросов:", data.message);
      }
    } catch (error) {
      console.error("Ошибка загрузки опросов:", error);
    }
  }

  // Отображение опросов
  function displaySurveys(surveys) {
    surveysList.innerHTML = "";

    if (surveys.length === 0) {
      surveysList.innerHTML =
        '<p class="no-surveys">У вас пока нет опросов</p>';
      return;
    }

    surveys.forEach((survey) => {
      const card = document.createElement("div");
      card.className = "survey-card";
      card.innerHTML = `
        <h3>${survey.title}</h3>
        <p>${survey.description || "Нет описания"}</p>
        <div class="survey-actions">
          ${getActionButtons(survey, userRole)}
        </div>
      `;
      surveysList.appendChild(card);
    });
  }

  // Генерация кнопок в зависимости от роли
  function getActionButtons(survey, role) {
    const isAuthor = survey.authorEmail === userEmail;
    let buttons = "";

    if (role === "admin" || (role === "teacher" && isAuthor)) {
      buttons += `
        <button onclick="viewResults('${survey.id}')" class="action-btn">Результаты</button>
        <button onclick="editSurvey('${survey.id}')" class="action-btn">Редактировать</button>
        <button onclick="deleteSurvey('${survey.id}')" class="action-btn delete">Удалить</button>
      `;
    }

    buttons += `<button onclick="takeSurvey('${survey.id}')" class="action-btn">Пройти</button>`;

    return buttons;
  }

  // Загружаем опросы при загрузке страницы
  await loadSurveys();
});

// Функции для работы с опросами
async function takeSurvey(surveyId) {
  window.location.href = `take-survey.html?id=${surveyId}`;
}

async function viewResults(surveyId) {
  window.location.href = `survey-results.html?id=${surveyId}`;
}

async function editSurvey(surveyId) {
  window.location.href = `edit-survey.html?id=${surveyId}`;
}

async function deleteSurvey(surveyId) {
  if (!confirm("Вы уверены, что хотите удалить этот опрос?")) return;

  try {
    const response = await fetch("/.netlify/functions/api/delete-survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surveyId,
        authorEmail: localStorage.getItem("userEmail"),
      }),
    });

    const data = await response.json();
    if (data.success) {
      location.reload();
    } else {
      alert(data.message || "Ошибка удаления опроса");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Произошла ошибка при удалении опроса");
  }
}

function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
}
