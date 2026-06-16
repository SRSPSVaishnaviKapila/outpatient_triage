// ============================================
// NAVIGATION.JS - Role-based navigation
// ============================================

function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const pageId = this.dataset.page;
      window.location.hash = pageId;
      showPage(pageId);
    });
  });
}

function showPage(pageId) {
  const targetPage = document.getElementById(pageId);
  if (!targetPage) {
    console.warn("⚠️ Page not found:", pageId);
    return;
  }

  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));

  // Show target page
  targetPage.classList.add("active-page");

  // Update nav active state
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
  const activeNav = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add("active");

  // Load page-specific data
  const loaders = {
    inventoryPage: typeof loadInventory === "function" ? loadInventory : null,
    doctorsPage:   typeof loadDoctors   === "function" ? loadDoctors   : null,
    patientsPage:  typeof loadPatients  === "function" ? loadPatients  : null,
    tokensPage:    typeof loadTokens    === "function" ? loadTokens    : null
  };

  if (loaders[pageId]) {
    setTimeout(loaders[pageId], 100);
  }
}

function setupWelcomeChoices() {
  document.querySelectorAll(".choice-card").forEach(card => {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      currentInputMode = this.dataset.input;
      updateInputModeUI();
      window.location.hash = "triagePage";
      showPage("triagePage");
    });
  });
}

// Track current input mode globally
let currentInputMode = "type";

function updateInputModeUI() {
  const badge = $("inputModeBadge");
  if (badge) {
    const labels = { type: "⌨️ Type", visual: "🧩 Visual Picker", voice: "🎙️ Voice" };
    badge.textContent = `Mode: ${labels[currentInputMode] || "⌨️ Type"}`;
  }

  const visualDiv = $("visualPicker");
  const voiceDiv  = $("voiceBox");
  if (visualDiv) visualDiv.classList.toggle("hidden", currentInputMode !== "visual");
  if (voiceDiv)  voiceDiv.classList.toggle("hidden",  currentInputMode !== "voice");

  if (currentInputMode === "visual") syncSelectedChipsToTextarea();
}

function syncSelectedChipsToTextarea() {
  const selected = [...document.querySelectorAll(".symptom-chip.selected")]
    .map(c => c.dataset.symptom);
  const ta = $("symptoms");
  if (ta) ta.value = selected.join(", ");
}

function applyRoleAccess() {
  const role = localStorage.getItem("userRole");

  if (!role) {
    window.location.href = "login.html";
    return;
  }

  // Pages each role may access
  const permissions = {
    patient:   ["welcomePage", "triagePage", "doctorsPage"],
    doctor:    ["patientsPage", "tokensPage"],
    inventory: ["inventoryPage"]
  };

  // Default landing page per role
  const defaultPages = {
    patient:   "welcomePage",
    doctor:    "patientsPage",
    inventory: "inventoryPage"
  };

  const allowed = permissions[role] || [];

  // Show / hide nav buttons
  document.querySelectorAll(".nav-link").forEach(btn => {
    const page = btn.dataset.page;
    btn.style.display = allowed.includes(page) ? "flex" : "none";
  });

  // Determine page to show
  const hash = window.location.hash.substring(1);
  const pageToShow = (hash && allowed.includes(hash)) ? hash : defaultPages[role];
  showPage(pageToShow);
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

// Expose globally
window.applyRoleAccess = applyRoleAccess;
window.setupLogout     = setupLogout;
window.showPage        = showPage;