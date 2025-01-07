document.addEventListener("DOMContentLoaded", function () {
  const surveyTitle = document.getElementById("survey-title");
  const surveyContent = document.getElementById("survey-content");

  function displaySurvey() {
    const survey = JSON.parse(localStorage.getItem("currentSurvey"));

    if (!survey) {
      window.location.href = "surveys.html";
      return;
    }

    surveyTitle.textContent = survey.title || "Опрос без названия";

    survey.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "view-question";

      let optionsHtml = "";
      if (question.type === "radio" || question.type === "checkbox") {
        optionsHtml = question.options
          .map(
            (option) => `
            <div class="view-option">
              <input type="${question.type}" name="question_${index}" disabled>
              <label>${option}</label>
            </div>
          `
          )
          .join("");
      }

      questionDiv.innerHTML = `
        <h3>Вопрос ${index + 1}</h3>
        <p class="question-text">${question.title}</p>
        ${optionsHtml}
        ${
          question.type === "text"
            ? '<input type="text" disabled placeholder="Текстовый ответ">'
            : ""
        }
      `;

      surveyContent.appendChild(questionDiv);
    });
  }

  displaySurvey();
});
