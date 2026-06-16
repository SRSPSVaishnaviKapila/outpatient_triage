// ============================================
// MAIN.JS - Application entry point
// ============================================

console.log("✅ main.js loaded");

(function () {
    if (window.location.pathname.includes("login.html")) return;

    const role = localStorage.getItem("userRole");

    if (!role) {
        window.location.replace("login.html");
        return;
    }

    console.log("✅ User authenticated as:", role);
})();

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ PHC frontend initializing");

    if (typeof setupTriageForm === "function") {
        setupTriageForm();
        console.log("✅ Triage form ready");
    }

    if (typeof setupVoiceInput === "function") {
        setupVoiceInput();
        console.log("✅ Voice input ready");
    }

    if (typeof initializeChatbot === "function") {
        initializeChatbot();
        console.log("✅ Chatbot ready");
    }

    setTimeout(() => {
        if (typeof switchMode === "function") {
            switchMode(localStorage.getItem("inputMode") || "type");
        }
    }, 200);
});
