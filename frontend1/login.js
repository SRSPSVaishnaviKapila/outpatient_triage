// ============================================
// LOGIN.JS - Login form handler
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // If already logged in, redirect to main app
  const existingRole = localStorage.getItem("userRole");
  if (existingRole) {
    window.location.href = "index.html";
    return;
  }

  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Demo credentials
  const credentials = {
    patient: { username: "patient", password: "patient123" },
    doctor: { username: "doctor", password: "doctor123" },
    inventory: { username: "inventory", password: "inventory123" }
  };

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("loginError");

    if (!role) {
      showError(errorDiv, "⚠️ Please select a role.");
      return;
    }
    if (!username || !password) {
      showError(errorDiv, "⚠️ Please enter both username and password.");
      return;
    }

    const cred = credentials[role];
    if (!cred || cred.username !== username || cred.password !== password) {
      showError(errorDiv, "❌ Invalid credentials. Please check your username and password.");
      return;
    }

    // Store session
    localStorage.setItem("userRole", role);
    localStorage.setItem("username", username);

    // Redirect
    window.location.href = "index.html";
  });

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }
});
