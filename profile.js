document.addEventListener("DOMContentLoaded", async () => {
  // Проверяем авторизацию
  const userEmail = localStorage.getItem("userEmail");
  const username = localStorage.getItem("username");
  const userRole = localStorage.getItem("userRole");

  if (!userEmail) {
    window.location.href = "index.html";
    return;
  }

  // Отображаем информацию о пользователе
  document.getElementById("user-email").textContent = userEmail;
  document.getElementById("username").textContent = username || "Не указано";
  document.getElementById("user-role").textContent = getRoleName(userRole);

  try {
    // Получаем созданные опросы
    const createdResponse = await fetch(
      "/.netlify/functions/api/get-user-surveys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      }
    );
    const createdData = await createdResponse.json();

    // Получаем пройденные опросы
    const completedResponse = await fetch(
      "/.netlify/functions/api/get-completed-surveys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      }
    );
    const completedData = await completedResponse.json();

    // Отображаем созданные опросы
    const createdList = document.getElementById("created-surveys-list");
    if (createdData.success && createdData.surveys.length > 0) {
      createdData.surveys.forEach((survey) => {
        createdList.appendChild(createSurveyCard(survey, true));
      });
    } else {
      createdList.innerHTML =
        '<p class="no-surveys">У вас пока нет созданных опросов</p>';
    }

    // Отображаем пройденные опросы
    const completedList = document.getElementById("completed-surveys-list");
    if (completedData.success && completedData.surveys.length > 0) {
      completedData.surveys.forEach((survey) => {
        completedList.appendChild(createSurveyCard(survey, false));
      });
    } else {
      completedList.innerHTML =
        '<p class="no-surveys">У вас пока нет пройденных опросов</p>';
    }
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
  }
});

// Вспомогательные функции
function getRoleName(role) {
  switch (role) {
    case "admin":
      return "Администратор";
    case "teacher":
      return "Преподаватель";
    case "student":
      return "Ученик";
    default:
      return "Роль не выбрана";
  }
}

function createSurveyCard(survey, isCreated) {
  const card = document.createElement("div");
  card.className = "survey-card";

  card.innerHTML = `
    <h3>${survey.title}</h3>
    <p>${survey.description || "Нет описания"}</p>
    <div class="survey-actions">
      ${getCardButtons(survey, isCreated)}
    </div>
  `;

  return card;
}

function getCardButtons(survey, isCreated) {
  if (isCreated) {
    return `
      <button onclick="viewResults('${survey.id}')" class="action-btn">Результаты</button>
      <button onclick="editSurvey('${survey.id}')" class="action-btn">Редактировать</button>
      <button onclick="deleteSurvey('${survey.id}')" class="action-btn delete">Удалить</button>
    `;
  }
  return `<button onclick="viewSurvey('${survey.id}')" class="action-btn">Просмотреть</button>`;
}

function viewResults(surveyId) {
  window.location.href = `survey-results.html?id=${surveyId}`;
}

function editSurvey(surveyId) {
  window.location.href = `edit-survey.html?id=${surveyId}`;
}

async function deleteSurvey(surveyId) {
  if (!confirm("Вы уверены, что хотите удалить этот опрос?")) {
    return;
  }

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

function viewSurvey(surveyId) {
  window.location.href = `view-survey.html?id=${surveyId}`;
}

function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("username");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
}
