// ============================================
// CONFIG.JS - API URL + UTILITIES + SYMPTOM DATA
// ============================================

// ⚠️ Change this to your backend URL if different
const API_URL = "http://localhost:8000";

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

// Symptom options list
const symptomOptions = [
  { name: "fever", emoji: "🤒" },
  { name: "high fever", emoji: "🌡️" },
  { name: "cough", emoji: "😷" },
  { name: "dry cough", emoji: "😮‍💨" },
  { name: "cold", emoji: "🤧" },
  { name: "runny nose", emoji: "🤧" },
  { name: "sore throat", emoji: "🗣️" },
  { name: "shortness of breath", emoji: "🫁" },
  { name: "chest pain", emoji: "❤️" },
  { name: "wheezing", emoji: "🫁" },
  { name: "headache", emoji: "🤕" },
  { name: "migraine", emoji: "🧠" },
  { name: "dizziness", emoji: "💫" },
  { name: "fainting", emoji: "😵‍💫" },
  { name: "unconsciousness", emoji: "🚨" },
  { name: "seizures", emoji: "⚡" },
  { name: "confusion", emoji: "❓" },
  { name: "blurred vision", emoji: "👁️" },
  { name: "eye pain", emoji: "👁️" },
  { name: "ear pain", emoji: "👂" },
  { name: "abdominal pain", emoji: "🤰" },
  { name: "stomach pain", emoji: "🤰" },
  { name: "vomiting", emoji: "🤮" },
  { name: "nausea", emoji: "😵" },
  { name: "diarrhea", emoji: "🚽" },
  { name: "constipation", emoji: "🚻" },
  { name: "loss of appetite", emoji: "🍽️" },
  { name: "blood in stool", emoji: "🩸" },
  { name: "acid reflux", emoji: "🔥" },
  { name: "bloating", emoji: "🎈" },
  { name: "body pain", emoji: "🦴" },
  { name: "back pain", emoji: "🧍" },
  { name: "joint pain", emoji: "🦵" },
  { name: "knee pain", emoji: "🦵" },
  { name: "neck pain", emoji: "🧣" },
  { name: "muscle pain", emoji: "💪" },
  { name: "leg pain", emoji: "🦵" },
  { name: "arm pain", emoji: "💪" },
  { name: "swelling", emoji: "🔵" },
  { name: "injury", emoji: "🩹" },
  { name: "rash", emoji: "🔴" },
  { name: "itching", emoji: "🧴" },
  { name: "skin redness", emoji: "🔴" },
  { name: "skin infection", emoji: "🦠" },
  { name: "burns", emoji: "🔥" },
  { name: "wound", emoji: "🩹" },
  { name: "severe bleeding", emoji: "🩸" },
  { name: "allergy", emoji: "🤧" },
  { name: "hives", emoji: "🔴" },
  { name: "pus discharge", emoji: "⚠️" },
  { name: "burning urination", emoji: "🚻" },
  { name: "frequent urination", emoji: "🚻" },
  { name: "blood in urine", emoji: "🩸" },
  { name: "lower abdominal pain", emoji: "🤰" },
  { name: "kidney pain", emoji: "🫘" },
  { name: "urine infection", emoji: "🦠" },
  { name: "dehydration", emoji: "💧" },
  { name: "excessive thirst", emoji: "🥤" },
  { name: "low urine output", emoji: "⚠️" },
  { name: "dark urine", emoji: "🟤" },
  { name: "fatigue", emoji: "😴" },
  { name: "weakness", emoji: "🥱" },
  { name: "weight loss", emoji: "⚖️" },
  { name: "weight gain", emoji: "⚖️" },
  { name: "night sweats", emoji: "💦" },
  { name: "chills", emoji: "🥶" },
  { name: "sweating", emoji: "💦" },
  { name: "sleep disturbance", emoji: "🛌" },
  { name: "anxiety", emoji: "😟" },
  { name: "palpitations", emoji: "💓" }
];