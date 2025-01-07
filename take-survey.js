document.addEventListener("DOMContentLoaded", function () {
  const surveyTitle = document.getElementById("survey-title");
  const surveyForm = document.getElementById("survey-form");

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

      let inputHtml = "";
      if (question.type === "text") {
        inputHtml = `<input type="text" name="question_${index}" required class="text-answer" placeholder="Ваш ответ">`;
      } else if (question.type === "radio" || question.type === "checkbox") {
        inputHtml = question.options
          .map(
            (option, optionIndex) => `
            <div class="view-option">
              <input type="${question.type}" 
                id="q${index}_opt${optionIndex}"
                name="question_${index}" 
                value="${option}"
                ${question.type === "radio" ? "required" : ""}>
              <label for="q${index}_opt${optionIndex}">${option}</label>
            </div>
          `
          )
          .join("");
      }

      questionDiv.innerHTML = `
        <h3>Вопрос ${index + 1}</h3>
        <p class="question-text">${question.title}</p>
        ${inputHtml}
      `;

      surveyForm.appendChild(questionDiv);
    });
  }

  displaySurvey();

  // Обработчик отправки формы
  surveyForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const survey = JSON.parse(localStorage.getItem("currentSurvey"));
    const answers = [];

    survey.questions.forEach((question, index) => {
      if (question.type === "text") {
        const answer = document.querySelector(
          `[name="question_${index}"]`
        ).value;
        answers.push({ questionTitle: question.title, answer });
      } else if (question.type === "radio") {
        const selected = document.querySelector(
          `[name="question_${index}"]:checked`
        );
        answers.push({
          questionTitle: question.title,
          answer: selected ? selected.value : null,
        });
      } else if (question.type === "checkbox") {
        const selected = Array.from(
          document.querySelectorAll(`[name="question_${index}"]:checked`)
        ).map((input) => input.value);
        answers.push({
          questionTitle: question.title,
          answer: selected,
        });
      }
    });

    // Сохраняем ответы
    const surveyResponses = JSON.parse(
      localStorage.getItem("surveyResponses") || "[]"
    );
    surveyResponses.push({
      surveyTitle: survey.title,
      answers: answers,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem("surveyResponses", JSON.stringify(surveyResponses));

    // Показываем сообщение об успехе и перенаправляем
    alert("Спасибо за ваши ответы!");
    window.location.href = "surveys.html";
  });
});
