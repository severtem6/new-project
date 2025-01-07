// Определяем функцию просмотра в глобальной области
window.viewSurvey = function (surveyTitle) {
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
  const survey = surveys.find((s) => s.title === surveyTitle);

  if (!survey) {
    console.error("Опрос не найден");
    return;
  }

  // Создаем модальное окно
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${survey.title || "Опрос без названия"}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        ${survey.questions
          .map(
            (question, qIndex) => `
            <div class="modal-question">
              <h3>Вопрос ${qIndex + 1}</h3>
              <p>${question.title}</p>
              ${
                question.type === "text"
                  ? '<input type="text" disabled placeholder="Текстовый ответ" class="modal-text-input">'
                  : question.options
                      .map(
                        (option) => `
                      <div class="modal-option">
                        <input type="${question.type}" disabled>
                        <label>${option}</label>
                      </div>
                    `
                      )
                      .join("")
              }
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Закрытие модального окна
  const closeBtn = modal.querySelector(".close-modal");
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Закрытие по клику вне модального окна
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

document.addEventListener("DOMContentLoaded", function () {
  const surveysCount = document.getElementById("surveys-count");
  const responsesCount = document.getElementById("responses-count");
  const recentSurveys = document.getElementById("recent-surveys");

  function updateStats() {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const responses = JSON.parse(
      localStorage.getItem("surveyResponses") || "[]"
    );

    surveysCount.textContent = surveys.length;
    responsesCount.textContent = responses.length;

    // Показываем последние 5 опросов
    const recentSurveysList = surveys.slice(-5).reverse();

    if (recentSurveysList.length === 0) {
      recentSurveys.innerHTML =
        '<p class="no-surveys">У вас пока нет опросов</p>';
      return;
    }

    recentSurveys.innerHTML = recentSurveysList
      .map(
        (survey) => `
        <div class="recent-survey-item">
          <div class="survey-info">
            <h3>${survey.title || "Опрос без названия"}</h3>
            <p>${survey.questions.length} вопросов</p>
            <p class="survey-date">Создан: ${new Date(
              survey.createdAt
            ).toLocaleDateString()}</p>
          </div>
          <div class="survey-actions">
            <button onclick="viewSurvey('${
              survey.title
            }')" class="view-btn">Просмотреть</button>
          </div>
        </div>
      `
      )
      .join("");
  }

  updateStats();
});
