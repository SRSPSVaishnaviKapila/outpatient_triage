window.appState = {
  currentPage: "welcomePage",
  currentMode: localStorage.getItem("inputMode") || "type"
};

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
    page.style.display = "none";
  });

  const page = document.getElementById(pageId);
  if (!page) return;

  page.classList.add("active-page");
  page.style.display = "block";

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  window.appState.currentPage = pageId;
  sessionStorage.setItem("currentPage", pageId);
  history.replaceState(null, "", "#" + pageId);

  if (pageId === "triagePage" && typeof switchMode === "function") {
    setTimeout(() => switchMode(localStorage.getItem("inputMode") || "type"), 100);
  }

  if (pageId === "inventoryPage" && typeof loadInventory === "function") loadInventory();
  if (pageId === "doctorsPage" && typeof loadDoctors === "function") loadDoctors();
  if (pageId === "patientsPage" && typeof loadPatients === "function") loadPatients();
  if (pageId === "tokensPage" && typeof loadTokens === "function") loadTokens();
}

function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();

      const pageId = btn.dataset.page;
      if (pageId) showPage(pageId);
    };
  });
}
function setupWelcomeChoices() {
  document.querySelectorAll(".choice-card").forEach(card => {
    card.onclick = e => {
      e.preventDefault();

      const mode = card.dataset.input;
      localStorage.setItem("inputMode", mode);
      window.appState.currentMode = mode;

      showPage("triagePage");

      setTimeout(() => {
        if (typeof switchMode === "function") switchMode(mode);
      }, 150);
    };
  });
}

function applyRoleAccess() {
  const role = localStorage.getItem("userRole");

  if (!role) {
    window.location.href = "login.html";
    return;
  }

  const permissions = {
    patient: ["welcomePage", "triagePage", "doctorsPage", "tokensPage"],
    doctor: ["triagePage", "patientsPage", "tokensPage"],
    inventory: ["welcomePage", "inventoryPage"]
  };

  const defaults = {
    patient: "welcomePage",
    doctor: "triagePage",
    inventory: "inventoryPage"
  };

  const allowed = permissions[role] || [];

  document.querySelectorAll(".nav-link").forEach(btn => {
    const page = btn.dataset.page;
    btn.style.display = allowed.includes(page) ? "flex" : "none";
  });

  const hash = window.location.hash.replace("#", "");
  showPage(allowed.includes(hash) ? hash : defaults[role]);
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupWelcomeChoices();
  setupLogout();
  applyRoleAccess();
});

window.showPage = showPage;
