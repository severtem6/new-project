document.addEventListener("DOMContentLoaded", () => {
  // Получаем все необходимые элементы
  const roleSelector = document.getElementById("role-selector");
  const roleSubmit = document.getElementById("role-submit");
  const adminPanel = document.getElementById("admin-panel");
  const teacherPanel = document.getElementById("teacher-panel");
  const studentPanel = document.getElementById("student-panel");
  const surveyCreation = document.getElementById("survey-creation");
  const studentManagement = document.getElementById("student-management");
  const userManagement = document.getElementById("user-management");
  const questionContainer = document.getElementById("questions-container");
  const addQuestionBtn = document.getElementById("add-question");
  const surveyForm = document.getElementById("survey-form");

  // Скрыть все панели
  function hideAllPanels() {
    adminPanel.style.display = "none";
    teacherPanel.style.display = "none";
    studentPanel.style.display = "none";
    surveyCreation.style.display = "none";
    studentManagement.style.display = "none";
    userManagement.style.display = "none";
  }

  // Обработка выбора роли
  roleSubmit.addEventListener("click", () => {
    const selectedRole = roleSelector.value;
    if (!selectedRole) {
      alert("Пожалуйста, выберите роль");
      return;
    }

    hideAllPanels();
    document.getElementById("role-selection").style.display = "none";

    // Сохраняем роль в localStorage
    localStorage.setItem("userRole", selectedRole);

    // Показываем соответствующую панель
    switch (selectedRole) {
      case "admin":
        adminPanel.style.display = "block";
        break;
      case "teacher":
        teacherPanel.style.display = "block";
        break;
      case "student":
        studentPanel.style.display = "block";
        loadAvailableSurveys();
        break;
    }
  });

  // Функции для админа и преподавателя
  window.showSurveyCreation = () => {
    hideAllPanels();
    surveyCreation.style.display = "block";
  };

  window.showUserManagement = () => {
    hideAllPanels();
    userManagement.style.display = "block";
    loadUsers();
  };

  window.showStudentManagement = () => {
    hideAllPanels();
    studentManagement.style.display = "block";
    loadStudents();
  };

  window.showAllSurveys = () => {
    hideAllPanels();
    studentPanel.style.display = "block";
    loadAllSurveys();
  };

  // Создание вопроса
  function createQuestion() {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
      <input type="text" class="question-title" placeholder="Введите вопрос" required>
      <select class="question-type" onchange="handleQuestionTypeChange(this)">
        <option value="text">Текстовый ответ</option>
        <option value="radio">Один из списка</option>
        <option value="checkbox">Несколько из списка</option>
      </select>
      <div class="options-container" style="display: none;">
        <button type="button" class="add-option">Добавить вариант</button>
        <div class="options-list"></div>
      </div>
      <button type="button" class="delete-question">&times;</button>
    `;

    questionContainer.appendChild(questionDiv);

    // Обработчики для кнопок
    const addOptionBtn = questionDiv.querySelector(".add-option");
    const optionsList = questionDiv.querySelector(".options-list");
    const deleteBtn = questionDiv.querySelector(".delete-question");

    addOptionBtn.addEventListener("click", () => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option";
      optionDiv.innerHTML = `
        <input type="text" class="option-input" placeholder="Вариант ответа" required>
        <button type="button" class="delete-option">&times;</button>
      `;
      optionsList.appendChild(optionDiv);

      optionDiv
        .querySelector(".delete-option")
        .addEventListener("click", () => {
          optionDiv.remove();
        });
    });

    deleteBtn.addEventListener("click", () => {
      questionDiv.remove();
    });
  }

  // Добавление вопроса
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener("click", createQuestion);
  }

  // Обработка отправки формы создания опроса
  if (surveyForm) {
    surveyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Начало создания опроса");

      const title = document.getElementById("survey-title").value.trim();
      const authorEmail = localStorage.getItem("userEmail");
      const userRole = localStorage.getItem("userRole");

      // Проверяем наличие всех необходимых данных
      if (!title) {
        alert("Введите название опроса");
        return;
      }

      if (!authorEmail) {
        alert("Необходимо авторизоваться");
        window.location.href = "index.html";
        return;
      }

      if (!userRole || (userRole !== "admin" && userRole !== "teacher")) {
        alert("У вас нет прав для создания опросов");
        return;
      }

      const questions = [];
      const questionDivs = document.querySelectorAll(".question");

      if (questionDivs.length === 0) {
        alert("Добавьте хотя бы один вопрос");
        return;
      }

      // Собираем вопросы
      for (const questionDiv of questionDivs) {
        const questionTitle = questionDiv
          .querySelector(".question-title")
          .value.trim();
        const questionType = questionDiv.querySelector(".question-type").value;

        if (!questionTitle) {
          alert("Заполните текст вопроса");
          return;
        }

        const options = [];
        if (questionType !== "text") {
          const optionInputs = questionDiv.querySelectorAll(".option-input");
          optionInputs.forEach((input) => {
            const value = input.value.trim();
            if (value) {
              options.push(value);
            }
          });

          if (options.length < 2) {
            alert("Добавьте минимум два варианта ответа");
            return;
          }
        }

        questions.push({
          title: questionTitle,
          type: questionType,
          options,
        });
      }

      const survey = {
        title,
        description: "Новый опрос",
        questions,
        authorEmail,
      };

      console.log("Отправляемые данные:", survey);

      try {
        const response = await fetch("/.netlify/functions/api/create-survey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(survey),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ответ сервера:", data);

        if (data.success) {
          alert("Опрос успешно создан!");
          window.location.href = "surveys.html";
        } else {
          alert(data.message || "Ошибка при создании опроса");
        }
      } catch (error) {
        console.error("Ошибка:", error);
        alert(`Произошла ошибка при сохранении опроса: ${error.message}`);
      }
    });
  }

  // Загрузка доступных опросов для студента
  async function loadAvailableSurveys() {
    try {
      const response = await fetch(
        "/.netlify/functions/api/get-available-surveys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: localStorage.getItem("userEmail") }),
        }
      );

      const data = await response.json();
      if (data.success) {
        displaySurveys(data.surveys);
      }
    } catch (error) {
      console.error("Ошибка загрузки опросов:", error);
    }
  }

  // Отображение опросов
  function displaySurveys(surveys) {
    const container = document.getElementById("available-surveys");
    container.innerHTML = "";

    surveys.forEach((survey) => {
      const card = document.createElement("div");
      card.className = "survey-card";
      card.innerHTML = `
        <h3>${survey.title}</h3>
        <p>${survey.description || "Нет описания"}</p>
        <div class="survey-actions">
          <button onclick="takeSurvey('${
            survey.id
          }')" class="action-btn">Пройти</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Управление учениками
  window.addStudent = async () => {
    const studentEmail = document.getElementById("student-email").value;
    try {
      const response = await fetch("/.netlify/functions/api/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherEmail: localStorage.getItem("userEmail"),
          studentEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Ученик успешно добавлен");
        loadStudents();
      } else {
        alert(data.message || "Ошибка при добавлении ученика");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка при добавлении ученика");
    }
  };
});

// Вспомогательные функции
function handleQuestionTypeChange(select) {
  const optionsContainer =
    select.parentElement.querySelector(".options-container");
  if (select.value === "text") {
    optionsContainer.style.display = "none";
  } else {
    optionsContainer.style.display = "block";
    if (optionsContainer.querySelector(".options-list").children.length === 0) {
      optionsContainer.querySelector(".add-option").click();
      optionsContainer.querySelector(".add-option").click();
    }
  }
}

function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
}
