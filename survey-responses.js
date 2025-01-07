document.addEventListener("DOMContentLoaded", function () {
  const surveyTitle = document.getElementById("survey-title");
  const totalResponses = document.getElementById("total-responses");
  const responsesContent = document.getElementById("responses-content");

  function displayResponses() {
    const survey = JSON.parse(localStorage.getItem("currentSurvey"));
    const allResponses = JSON.parse(
      localStorage.getItem("surveyResponses") || "[]"
    );

    if (!survey) {
      window.location.href = "surveys.html";
      return;
    }

    // Находим ответы только для текущего опроса
    const surveyResponses = allResponses.filter(
      (response) => response.surveyTitle === survey.title
    );

    surveyTitle.textContent = survey.title || "Опрос без названия";
    totalResponses.textContent = `Всего ответов: ${surveyResponses.length}`;

    // Создаем контейнер для каждого вопроса
    survey.questions.forEach((question, qIndex) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "response-question";

      let answersHtml = "";
      if (question.type === "text") {
        // Для текстовых ответов показываем список
        const textAnswers = surveyResponses
          .map((response) => response.answers[qIndex].answer)
          .filter((answer) => answer) // Убираем пустые ответы
          .map((answer) => `<li class="text-response">${answer}</li>`)
          .join("");

        answersHtml = `
          <div class="text-responses">
            <h4>Ответы:</h4>
            <ul>${textAnswers || "<li>Нет ответов</li>"}</ul>
          </div>
        `;
      } else if (question.type === "radio" || question.type === "checkbox") {
        // Для выбора вариантов показываем статистику
        const optionStats = {};
        question.options.forEach((option) => {
          optionStats[option] = 0;
        });

        surveyResponses.forEach((response) => {
          const answer = response.answers[qIndex].answer;
          if (Array.isArray(answer)) {
            // checkbox
            answer.forEach((option) => {
              optionStats[option]++;
            });
          } else if (answer) {
            // radio
            optionStats[answer]++;
          }
        });

        answersHtml = `
          <div class="option-stats">
            ${Object.entries(optionStats)
              .map(([option, count]) => {
                const percentage = surveyResponses.length
                  ? Math.round((count / surveyResponses.length) * 100)
                  : 0;
                return `
                  <div class="option-stat">
                    <div class="option-label">${option}</div>
                    <div class="stat-bar-container">
                      <div class="stat-bar" style="width: ${percentage}%"></div>
                      <span class="stat-value">${count} (${percentage}%)</span>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      }

      questionDiv.innerHTML = `
        <h3>Вопрос ${qIndex + 1}: ${question.title}</h3>
        ${answersHtml}
      `;

      responsesContent.appendChild(questionDiv);
    });
  }

  displayResponses();
});
