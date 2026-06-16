// ============================================
// MAIN.JS - Application entry point
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ PHC Triage Assistant initializing…");

  if (typeof setupNavigation      === "function") { setupNavigation();      console.log("✅ Navigation ready"); }
  if (typeof setupWelcomeChoices  === "function") { setupWelcomeChoices();  console.log("✅ Welcome choices ready"); }
  if (typeof renderSymptomPicker  === "function") { renderSymptomPicker();  console.log("✅ Symptom picker ready"); }
  if (typeof setupVoiceInput      === "function") { setupVoiceInput();      console.log("✅ Voice input ready"); }
  if (typeof setupTriageForm      === "function") { setupTriageForm();      console.log("✅ Triage form ready"); }
  if (typeof initializeChatbot    === "function") { initializeChatbot();    console.log("✅ Chatbot ready"); }
  if (typeof setupLogout          === "function") { setupLogout();          console.log("✅ Logout ready"); }

  // Apply role access LAST (needs DOM fully ready)
  if (typeof applyRoleAccess === "function") {
    setTimeout(() => {
      applyRoleAccess();
      console.log("✅ Role access applied");
    }, 50);
  }
});