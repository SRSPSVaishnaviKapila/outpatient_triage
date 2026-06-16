// ============================================
// CONFIG.JS - API URL + UTILITIES + SYMPTOM DATA
// ============================================

// ⚠️ Change this to your backend URL if different
const API_URL = "http://127.0.0.1:8000";

// Global shorthand for getElementById
function $(id) {
  return document.getElementById(id);
}

// CSV splitter
function splitCSV(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

// HTML escape utility
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

