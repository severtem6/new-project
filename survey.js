document.addEventListener("DOMContentLoaded", function () {
  const roleSelector = document.getElementById("role-selector");
  const roleSubmit = document.getElementById("role-submit");

  const surveyForm = document.getElementById("survey-form");
  const surveyList = document.getElementById("survey-list");
  const studentManagement = document.getElementById("student-management");

  const addStudentForm = document.getElementById("add-student-form");
  const studentList = document.getElementById("student-list");

  // Скрыть все секции
  function hideAllSections() {
    surveyForm.style.display = "none";
    surveyList.style.display = "none";
    studentManagement.style.display = "none";
  }

  // Обработка выбора роли
  roleSubmit.addEventListener("click", () => {
    const selectedRole = roleSelector.value;
    hideAllSections();

    if (selectedRole === "teacher") {
      surveyForm.style.display = "block";
      studentManagement.style.display = "block";
    } else if (selectedRole === "student") {
      surveyList.style.display = "block";
    } else if (selectedRole === "admin") {
      surveyForm.style.display = "block";
      surveyList.style.display = "block";
      studentManagement.style.display = "block";
    }
  });

  // Функция добавления учеников
  addStudentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const studentName = document.getElementById("student-name").value.trim();

    if (studentName) {
      const li = document.createElement("li");
      li.textContent = studentName;
      studentList.appendChild(li);

      // Очистить поле ввода
      document.getElementById("student-name").value = "";
    }
  });

  // Обработка создания и сохранения опросов (существующий код)
  const addQuestionBtn = document.getElementById("add-question");
  const questionContainer = document.querySelector(".question-container");
  const form = document.getElementById("survey-form");

  function createQuestion() {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
      <input type="text" class="question-title" placeholder="Вопрос без заголовка">
      <select class="question-type">
        <option value="text">Текст</option>
        <option value="radio">Один из списка</option>
        <option value="checkbox">Несколько из списка</option>
      </select>
      <button type="button" class="delete-question">Удалить</button>
    `;

    questionContainer.appendChild(questionDiv);

    // Удаление вопроса
    questionDiv.querySelector(".delete-question").addEventListener("click", () => {
      questionDiv.remove();
    });
  }

  addQuestionBtn.addEventListener("click", createQuestion);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Сохранение опросов (существующий код)
    const surveyTitle = document.getElementById("survey-title").value.trim();
    const questions = [];
    document.querySelectorAll(".question").forEach((questionDiv) => {
      const title = questionDiv.querySelector(".question-title").value;
      const type = questionDiv.querySelector(".question-type").value;

      questions.push({ title, type });
    });

    const survey = { title: surveyTitle, questions };
    const surveys = JSON.parse(localStorage.getItem("surveys") || "[]");
    surveys.push(survey);
    localStorage.setItem("surveys", JSON.stringify(surveys));

    alert("Опрос сохранён!");
  });
});
