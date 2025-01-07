document.addEventListener("DOMContentLoaded", function () {
  const surveysList = document.getElementById("surveys-list");

  function displaySurveys() {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    surveysList.innerHTML = "";

    if (surveys.length === 0) {
      surveysList.innerHTML =
        '<p class="no-surveys">У вас пока нет опросов</p>';
      return;
    }

    surveys.forEach((survey, index) => {
      const surveyCard = document.createElement("div");
      surveyCard.className = "survey-card";
      surveyCard.innerHTML = `
        <h2>${survey.title || "Опрос без названия"}</h2>
        <p>${survey.questions.length} вопросов</p>
        <div class="survey-actions">
          <button onclick="takeSurvey(${index})" class="take-btn">Пройти</button>
          <button onclick="viewSurvey(${index})" class="view-btn">Просмотреть</button>
          <button onclick="viewResponses(${index})" class="responses-btn">Ответы</button>
          <button onclick="deleteSurvey(${index})" class="delete-btn">Удалить</button>
        </div>
      `;
      surveysList.appendChild(surveyCard);
    });
  }

  // Первоначальное отображение опросов
  displaySurveys();

  // Добавляем функции в глобальную область видимости
  window.viewSurvey = function (index) {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const survey = surveys[index];

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

  window.deleteSurvey = function (index) {
    if (confirm("Вы уверены, что хотите удалить этот опрос?")) {
      const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
      surveys.splice(index, 1);
      localStorage.setItem("surveys", JSON.stringify(surveys));
      displaySurveys();
    }
  };

  window.takeSurvey = function (index) {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const survey = surveys[index];

    localStorage.setItem("currentSurvey", JSON.stringify(survey));
    window.location.href = "take-survey.html";
  };

  window.viewResponses = function (index) {
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    const survey = surveys[index];
    localStorage.setItem("currentSurvey", JSON.stringify(survey));
    window.location.href = "survey-responses.html";
  };
});
