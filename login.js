document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/.netlify/functions/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Сохраняем данные пользователя
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("userRole", data.user.role);

      // Перенаправляем на профиль
      window.location.href = "profile.html";
    } else {
      alert(data.message || "Ошибка входа");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Произошла ошибка при входе");
  }
});
