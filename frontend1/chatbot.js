// ============================================
// CHATBOT.JS - Role-based PHC Assistant with Guardrails
// ============================================

let chatbotIsOpen = false;

let chatbotSession = {
  active: false,
  symptom: null,
  step: 0,
  collectedData: {
    duration: null,
    severity: null,
    additionalSymptoms: []
  }
};

const CONTACT_INFO = {
  reception: "📞 PHC Reception: +91-XXXXXXXXXX",
  emergency: "🚨 Emergency: 108",
  pharmacy: "💊 Pharmacy: +91-XXXXXXXXXX",
  ambulance: "🚑 Ambulance: 108"
};

const EMERGENCY_WORDS = [
  "emergency", "urgent", "critical", "dying", "accident",
  "severe bleeding", "unconscious", "heart attack", "stroke",
  "chest pain", "breathing difficulty", "shortness of breath",
  "seizure", "poison", "fainting"
];

const BLOCKED_WORDS = [
  "hack", "bypass", "password", "admin access", "delete database",
  "drop table", "token key", "api key", "private data"
];

const SYMPTOM_KNOWLEDGE = {
  fever: {
    definition: "Fever means body temperature is higher than normal, commonly due to infection.",
    advice: "Drink fluids, rest, monitor temperature, and visit PHC if fever lasts more than 3 days.",
    redFlags: "Very high fever, confusion, seizures, breathing problem, or fever in infants."
  },
  cough: {
    definition: "Cough is a reflex that clears the throat or airways.",
    advice: "Drink warm fluids, avoid dust/smoke, and consult doctor if cough lasts more than 1 week.",
    redFlags: "Coughing blood, chest pain, breathing difficulty, or high fever."
  },
  headache: {
    definition: "Headache is pain or pressure in the head or neck region.",
    advice: "Rest, drink water, avoid stress, and consult doctor if severe or repeated.",
    redFlags: "Sudden severe headache, vomiting, blurred vision, weakness, or confusion."
  },
  "chest pain": {
    definition: "Chest pain is discomfort in the chest area and may be related to heart, lungs, acidity, or muscle pain.",
    advice: "Do not ignore chest pain. Visit doctor immediately.",
    redFlags: "Pain spreading to left arm/jaw, sweating, breathlessness, fainting."
  },
  "abdominal pain": {
    definition: "Abdominal pain is pain in the stomach or belly area.",
    advice: "Avoid heavy food, drink fluids, and consult doctor if pain continues.",
    redFlags: "Severe pain, vomiting, fever, blood in stool, pregnancy pain."
  },
  vomiting: {
    definition: "Vomiting is forceful emptying of stomach contents.",
    advice: "Take small sips of ORS/water and avoid oily food.",
    redFlags: "Repeated vomiting, dehydration, blood vomiting, severe stomach pain."
  },
  diarrhea: {
    definition: "Diarrhea means frequent loose or watery stools.",
    advice: "Take ORS, drink clean water, and maintain hygiene.",
    redFlags: "Blood in stool, dehydration, severe weakness, fever."
  },
  dizziness: {
    definition: "Dizziness means feeling lightheaded, unsteady, or faint.",
    advice: "Sit down, drink water, and avoid sudden standing.",
    redFlags: "Fainting, chest pain, weakness on one side, confusion."
  },
  rash: {
    definition: "Rash is a visible change in skin color or texture.",
    advice: "Avoid scratching and keep the area clean.",
    redFlags: "Rash with fever, swelling of face, breathing difficulty, pus."
  },
  "burning urination": {
    definition: "Burning urination means pain or burning sensation while passing urine.",
    advice: "Drink water and consult doctor for possible urine infection.",
    redFlags: "Fever, blood in urine, lower abdominal pain, back pain."
  },
  weakness: {
    definition: "Weakness means reduced strength or low energy.",
    advice: "Rest, drink fluids, and eat nutritious food.",
    redFlags: "Sudden weakness on one side, fainting, confusion, chest pain."
  },
  "sore throat": {
    definition: "Sore throat means pain or irritation in the throat.",
    advice: "Drink warm fluids and avoid cold drinks.",
    redFlags: "Difficulty breathing, high fever, inability to swallow."
  },
  "ear pain": {
    definition: "Ear pain is discomfort or pain inside or around the ear.",
    advice: "Avoid inserting objects into the ear and consult doctor if pain continues.",
    redFlags: "Ear discharge, fever, hearing loss, severe pain."
  },
  "tooth pain": {
    definition: "Tooth pain is pain in or around a tooth.",
    advice: "Maintain oral hygiene and consult a dentist/doctor.",
    redFlags: "Facial swelling, fever, pus, severe unbearable pain."
  }
};

function getUserRole() {
  return localStorage.getItem("userRole") || "patient";
}

function sanitizeUserMessage(text) {
  return String(text || "").replace(/[<>]/g, "").trim().slice(0, 500);
}

function isUnsafeMessage(message) {
  const lower = message.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
}

function isEmergencyMessage(message) {
  const lower = message.toLowerCase();
  return EMERGENCY_WORDS.some(word => lower.includes(word));
}

async function fetchFromBackend(endpoint) {
  try {
    const baseUrl = window.API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}${endpoint}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable:", endpoint, err);
    return null;
  }
}

function getSymptomDefinition(lowerMsg) {
  for (const key in SYMPTOM_KNOWLEDGE) {
    if (lowerMsg.includes(key)) {
      const s = SYMPTOM_KNOWLEDGE[key];
      return `📖 **${key.toUpperCase()}**

**Definition:** ${s.definition}

**Basic advice:** ${s.advice}

**Red flags:** ${s.redFlags}

⚠️ This is only general guidance. For diagnosis, submit the Triage form or consult a doctor.`;
    }
  }
  return null;
}

// ============================================
// INIT
// ============================================

function initializeChatbot() {
  const widget = document.getElementById("chatbotWidget");
  const toggleBtn = document.getElementById("chatbotToggle");
  const header = document.getElementById("chatbotHeader");
  const sendBtn = document.getElementById("chatbotSendBtn");
  const input = document.getElementById("chatbotInput");

  if (!widget) return;

  widget.classList.add("collapsed");
  chatbotIsOpen = false;
  if (toggleBtn) toggleBtn.textContent = "+";

  if (header) {
    header.onclick = function (e) {
      if (e.target.closest(".chatbot-toggle")) return;
      toggleChatbotWidget();
    };
  }

  if (toggleBtn) {
    toggleBtn.onclick = function (e) {
      e.stopPropagation();
      toggleChatbotWidget();
    };
  }

  if (sendBtn && input) {
    sendBtn.onclick = () => sendChatMessage(input);
    input.onkeypress = e => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChatMessage(input);
      }
    };
  }

  resetChatWindowForRole();
}

function resetChatWindowForRole() {
  const container = document.getElementById("chatbotMessages");
  if (!container) return;

  const role = getUserRole();

  container.innerHTML = `
    <div class="message bot">
      <div class="message-content">
        ${formatBotText(getRoleGreeting(role))}
      </div>
    </div>
  `;
}

function toggleChatbotWidget() {
  const widget = document.getElementById("chatbotWidget");
  const toggleBtn = document.getElementById("chatbotToggle");

  if (!widget) return;

  widget.classList.toggle("collapsed");
  chatbotIsOpen = !widget.classList.contains("collapsed");

  if (toggleBtn) toggleBtn.textContent = chatbotIsOpen ? "−" : "+";
}

// ============================================
// MESSAGE UI
// ============================================

async function sendChatMessage(inputEl) {
  const cleanText = sanitizeUserMessage(inputEl.value);
  if (!cleanText) return;

  addChatMessage(cleanText, "user");
  inputEl.value = "";

  showChatTyping();
  const response = await getChatbotResponse(cleanText);
  hideChatTyping();

  addChatMessage(response, "bot");
}

function formatBotText(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function addChatMessage(text, sender) {
  const container = document.getElementById("chatbotMessages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `message ${sender}`;

  const content = document.createElement("div");
  content.className = "message-content";

  if (sender === "bot") {
    content.innerHTML = formatBotText(text);
  } else {
    content.textContent = text;
  }

  div.appendChild(content);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showChatTyping() {
  const container = document.getElementById("chatbotMessages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "message bot";
  div.id = "typingIndicator";
  div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideChatTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ============================================
// ROUTER
// ============================================

async function getChatbotResponse(message) {
  const role = getUserRole();
  const lowerMsg = message.toLowerCase();

  if (isUnsafeMessage(message)) {
    return `⚠️ **I can't help with that request.**

I can only help with PHC-related tasks like symptoms, doctors, tokens, patient records, and medicine stock.`;
  }

  if (isEmergencyMessage(message)) {
    return `🚨 **EMERGENCY ALERT**

Please seek immediate medical attention immediately.

${CONTACT_INFO.emergency}
${CONTACT_INFO.ambulance}

Do not wait for chatbot guidance in emergencies.`;
  }

  if (/^(hi|hello|hey|namaste|help)\b/.test(lowerMsg)) {
    return getRoleGreeting(role);
  }

  if (role === "doctor") return await doctorFlow(lowerMsg);
  if (role === "inventory") return await inventoryFlow(lowerMsg);

  return await patientFlow(lowerMsg, message);
}

function getRoleGreeting(role) {
  if (role === "doctor") {
    return `👨‍⚕️ **Hello Doctor!**

You can ask:
• "Show patient records"
• "How many high cases?"
• "How many medium cases?"
• "How many low cases?"
• "Show patient Vaishnavi"
• "Token queue"
• "Medicine stock"

Patient data is shown only in Doctor login.`;
  }

  if (role === "inventory") {
    return `📦 **Hello Inventory Staff!**

You can ask:
• "Check stock"
• "Low stock medicines"
• "Restock suggestions"
• "Expiry guidance"
• "Is paracetamol available?"
• "Inventory summary"

Inventory role cannot access patient records.`;
  }

  return `👋 **Hello! I'm your PHC Health Assistant.**

You can ask:
• "I have fever"
• "What is fever?"
• "Meaning of cough"
• "Is paracetamol available?"
• "Which doctors are available?"
• "What is my token?"

For diagnosis and treatment, please submit the Triage form or consult a doctor.`;
}

// ============================================
// PATIENT FLOW
// ============================================

async function patientFlow(lowerMsg, rawMsg) {
  if (chatbotSession.active && chatbotSession.symptom) {
    return processFollowUp(rawMsg, chatbotSession.symptom);
  }

  if (
    lowerMsg.includes("patient record") ||
    lowerMsg.includes("patient history") ||
    lowerMsg.includes("all patients")
  ) {
    return `🔒 **Access restricted.**

Patient records are available only under Doctor login.`;
  }

  if (
    lowerMsg.includes("what is") ||
    lowerMsg.includes("meaning") ||
    lowerMsg.includes("definition") ||
    lowerMsg.includes("explain")
  ) {
    const def = getSymptomDefinition(lowerMsg);
    if (def) return def;
  }

  const symptoms = window.symptomOptions || [];
  const matchedFromPicker = symptoms.find(s =>
    lowerMsg.includes(String(s.name || "").toLowerCase())
  );

  const matchedFromKnowledge = Object.keys(SYMPTOM_KNOWLEDGE).find(sym =>
    lowerMsg.includes(sym)
  );

  const matchedSymptom = matchedFromPicker?.name || matchedFromKnowledge;

  if (matchedSymptom) {
    chatbotSession.active = true;
    chatbotSession.symptom = matchedSymptom;
    chatbotSession.step = 1;

    const def = SYMPTOM_KNOWLEDGE[String(matchedSymptom).toLowerCase()];
    const extra = def ? `\n\n📖 ${def.definition}` : "";

    return `🩺 **I understand you have ${matchedSymptom}.**${extra}

📅 How many days have you had this symptom?`;
  }

  if (
    lowerMsg.includes("medicine") ||
    lowerMsg.includes("tablet") ||
    lowerMsg.includes("drug") ||
    lowerMsg.includes("stock") ||
    lowerMsg.includes("available")
  ) {
    return await getMedicineAvailabilityForPatient(lowerMsg);
  }

  if (
    lowerMsg.includes("doctor") ||
    lowerMsg.includes("specialist") ||
    lowerMsg.includes("physician")
  ) {
    return await getDoctorInfoForPatient();
  }

  if (
    lowerMsg.includes("token") ||
    lowerMsg.includes("queue") ||
    lowerMsg.includes("wait")
  ) {
    return await getTokenInfoForPatient();
  }

  return `🤔 **I didn't understand that clearly.**

You can ask:
• "I have fever"
• "What is chest pain?"
• "Meaning of burning urination"
• "Is paracetamol available?"
• "Which doctors are available?"
• "What is my token?"

${CONTACT_INFO.reception}`;
}

function processFollowUp(message, symptom) {
  const lowerMsg = message.toLowerCase();

  if (chatbotSession.step === 1) {
    const match = message.match(/\d+/);
    chatbotSession.collectedData.duration = match ? `${match[0]} days` : message;
    chatbotSession.step = 2;

    return `✅ Noted — **${chatbotSession.collectedData.duration}**.

⚠️ How severe is your ${symptom}?

Reply: Mild / Moderate / Severe`;
  }

  if (chatbotSession.step === 2) {
    chatbotSession.collectedData.severity = lowerMsg.includes("severe")
      ? "Severe"
      : lowerMsg.includes("mild")
        ? "Mild"
        : "Moderate";

    chatbotSession.step = 3;

    return `✅ Noted — **${chatbotSession.collectedData.severity}**.

🤒 Any other symptoms?

Type "none" if there are no other symptoms.`;
  }

  if (chatbotSession.step === 3) {
    const others =
      lowerMsg === "none"
        ? []
        : message.split(",").map(s => s.trim()).filter(Boolean);

    chatbotSession.collectedData.additionalSymptoms = others;

    const savedData = {
      symptom,
      duration: chatbotSession.collectedData.duration,
      severity: chatbotSession.collectedData.severity,
      additionalSymptoms: chatbotSession.collectedData.additionalSymptoms
    };

    resetChatbotSession();

    return `📋 **Symptom Summary**

• Main symptom: ${savedData.symptom}
• Duration: ${savedData.duration}
• Severity: ${savedData.severity}
• Other symptoms: ${savedData.additionalSymptoms.length ? savedData.additionalSymptoms.join(", ") : "None"}

✅ Please submit the Triage form to generate token and doctor assignment.

⚠️ If symptoms are severe or worsening, contact PHC immediately.

${CONTACT_INFO.reception}`;
  }

  resetChatbotSession();
  return `Please submit the Triage form for full assessment.`;
}

function resetChatbotSession() {
  chatbotSession = {
    active: false,
    symptom: null,
    step: 0,
    collectedData: {
      duration: null,
      severity: null,
      additionalSymptoms: []
    }
  };
}

async function getMedicineAvailabilityForPatient(lowerMsg) {
  const data = await fetchFromBackend("/inventory");

  if (data && data.items && data.items.length > 0) {
    const specific = data.items.find(i =>
      lowerMsg.includes(String(i.medicine_name || "").toLowerCase())
    );

    if (specific) {
      const qty = Number(specific.quantity || 0);
      return `💊 **${specific.medicine_name}**

Quantity: **${qty} units**
Status: ${qty > 50 ? "✅ Available" : qty > 0 ? "⚠️ Limited stock" : "❌ Out of stock"}

⚠️ Please take medicines only as advised by a doctor.`;
    }

    const available = data.items
      .filter(i => Number(i.quantity || 0) > 0)
      .slice(0, 8)
      .map(i => `• ${i.medicine_name} — ${Number(i.quantity || 0) > 50 ? "✅ Available" : "⚠️ Limited"}`)
      .join("\n");

    return `💊 **Medicine Availability**

${available || "No stock data available."}

⚠️ Please take medicines only as advised by a doctor.

${CONTACT_INFO.pharmacy}`;
  }

  return `💊 Medicine stock data is currently unavailable.

Please contact pharmacy.

${CONTACT_INFO.pharmacy}`;
}

async function getDoctorInfoForPatient() {
  const data = await fetchFromBackend("/doctors");

  if (data && data.doctors && data.doctors.length > 0) {
    const list = data.doctors
      .slice(0, 5)
      .map(d => `• ${d.doctor_name} — ${d.specialization || "General Medicine"} (${d.availability || "Available"})`)
      .join("\n");

    return `👨‍⚕️ **Available Doctors**

${list}

For doctor assignment, please complete the Triage form.`;
  }

  return `👨‍⚕️ Doctor availability is currently unavailable.

${CONTACT_INFO.reception}`;
}

async function getTokenInfoForPatient() {
  return `🎫 **Token Help**

After you submit the Triage form, your token number and queue position will appear on screen.

Please wait until your token is called.`;
}

// ============================================
// DOCTOR FLOW
// ============================================

async function doctorFlow(lowerMsg) {
  if (
    lowerMsg.includes("show patient") ||
    lowerMsg.includes("find patient") ||
    lowerMsg.includes("patient details") ||
    lowerMsg.includes("details of")
  ) {
    return await getSpecificPatientDetailsForDoctor(lowerMsg);
  }

  if (
    lowerMsg.includes("how many") ||
    lowerMsg.includes("count") ||
    lowerMsg.includes("cases") ||
    lowerMsg.includes("priority")
  ) {
    return await getPatientSummaryForDoctor();
  }

  if (
    lowerMsg.includes("stock") ||
    lowerMsg.includes("medicine") ||
    lowerMsg.includes("inventory")
  ) {
    return await getInventorySummaryForDoctor();
  }

  if (
    lowerMsg.includes("token") ||
    lowerMsg.includes("queue") ||
    lowerMsg.includes("waiting")
  ) {
    return await getTokenSummaryForDoctor();
  }

  if (
    lowerMsg.includes("patient") ||
    lowerMsg.includes("record") ||
    lowerMsg.includes("history")
  ) {
    return await getPatientSummaryForDoctor();
  }

  return `👨‍⚕️ **Doctor Assistant**

You can ask:
• "Show patient records"
• "How many low cases?"
• "How many medium cases?"
• "How many high cases?"
• "Show patient Vaishnavi"
• "Token queue"
• "Medicine stock"`;
}

async function getPatientSummaryForDoctor() {
  const data = await fetchFromBackend("/patients");

  if (data && data.patients && data.patients.length > 0) {
    const patients = data.patients;

    const emergency = patients.filter(p => ["EMERGENCY", "CRITICAL"].includes(String(p.priority || p.severity || "").toUpperCase()));
    const high = patients.filter(p => String(p.priority || p.severity || "").toUpperCase() === "HIGH");
    const medium = patients.filter(p => String(p.priority || p.severity || "").toUpperCase() === "MEDIUM");
    const low = patients.filter(p => String(p.priority || p.severity || "").toUpperCase() === "LOW");

    const recent = patients.slice(0, 5)
      .map(p => `• ${p.patient_name} — ${p.predicted_disease || "Under Evaluation"} (${p.priority || p.severity || "—"})`)
      .join("\n");

    return `📋 **Patient Records Summary**

Total records: **${patients.length}**
🚨 Emergency/Critical: **${emergency.length}**
🔴 High: **${high.length}**
🟡 Medium: **${medium.length}**
🟢 Low: **${low.length}**

Recent patients:
${recent}

You can ask: "show patient Vaishnavi"`;
  }

  return `📋 No patient records found yet.`;
}

async function getSpecificPatientDetailsForDoctor(lowerMsg) {
  const data = await fetchFromBackend("/patients");

  if (!data || !data.patients || data.patients.length === 0) {
    return `📋 No patient records found.`;
  }

  let name = lowerMsg
    .replace("show patient", "")
    .replace("find patient", "")
    .replace("patient details", "")
    .replace("details of", "")
    .trim();

  if (!name) {
    return `Please enter patient name. Example: **show patient Vaishnavi**`;
  }

  const patient = data.patients.find(p =>
    String(p.patient_name || "").toLowerCase().includes(name)
  );

  if (!patient) {
    return `❌ No patient found with name **${name}**.`;
  }

  return `📋 **Patient Details**

Name: **${patient.patient_name || "—"}**
Age: **${patient.age || "—"}**
Gender: **${patient.gender || "—"}**
Symptoms: **${patient.symptoms || patient.matched_symptoms || "—"}**
Disease: **${patient.predicted_disease || "Under Evaluation"}**
Priority: **${patient.priority || patient.severity || "—"}**
Confidence: **${patient.confidence_score || "—"}**
Date: **${patient.created_at || "—"}**`;
}

async function getTokenSummaryForDoctor() {
  const data = await fetchFromBackend("/tokens");

  if (data && data.tokens && data.tokens.length > 0) {
    const tokens = data.tokens;
    const high = tokens.filter(t => {
      const p = String(t.priority || "").toUpperCase();
      return ["HIGH", "EMERGENCY", "CRITICAL"].includes(p);
    });

    return `🎫 **Token Queue Summary**

Total tokens: **${tokens.length}**
High priority: **${high.length}**

${high.slice(0, 5).map(t => `• ${t.token_number} — ${t.patient_name} (${t.priority})`).join("\n") || "No high-priority tokens."}`;
  }

  return `🎫 No active tokens found.`;
}

async function getInventorySummaryForDoctor() {
  const data = await fetchFromBackend("/inventory");

  if (data && data.items && data.items.length > 0) {
    const low = data.items.filter(i => Number(i.quantity || 0) < 50);

    return `💊 **Inventory Summary**

Total medicines: **${data.items.length}**
Low stock: **${low.length}**

${low.slice(0, 5).map(i => `• ${i.medicine_name} — ${i.quantity} units`).join("\n") || "No low-stock medicines."}`;
  }

  return `💊 Inventory data unavailable.`;
}

// ============================================
// INVENTORY FLOW
// ============================================

async function inventoryFlow(lowerMsg) {
  if (
    lowerMsg.includes("patient") ||
    lowerMsg.includes("record") ||
    lowerMsg.includes("history")
  ) {
    return `🔒 **Access restricted.**

Inventory role cannot access patient records.`;
  }

  if (lowerMsg.includes("doctor") || lowerMsg.includes("token")) {
    return `🔒 **Access restricted.**

Inventory role is limited to medicine stock and availability.`;
  }

  if (
    lowerMsg.includes("expired") ||
    lowerMsg.includes("expiry") ||
    lowerMsg.includes("expire")
  ) {
    return `📅 **Expiry Tracking**

Use FEFO method: **First Expiry, First Out**.

Suggested action:
• Separate near-expiry medicines
• Inform pharmacist/PHC admin
• Avoid issuing expired medicines`;
  }

  if (
    lowerMsg.includes("reorder") ||
    lowerMsg.includes("restock") ||
    lowerMsg.includes("purchase")
  ) {
    return await getRestockSuggestions();
  }

  if (
    lowerMsg.includes("summary") ||
    lowerMsg.includes("overview") ||
    lowerMsg.includes("stock") ||
    lowerMsg.includes("inventory") ||
    lowerMsg.includes("medicine") ||
    lowerMsg.includes("low") ||
    lowerMsg.includes("available")
  ) {
    return await getInventorySummaryForInventory(lowerMsg);
  }

  return `📦 **Inventory Assistant**

You can ask:
• "Check stock"
• "Low stock medicines"
• "Restock suggestions"
• "Expiry guidance"
• "Inventory summary"
• "Is paracetamol available?"`;
}

async function getInventorySummaryForInventory(lowerMsg = "") {
  const data = await fetchFromBackend("/inventory");

  if (data && data.items && data.items.length > 0) {
    const specific = data.items.find(i =>
      lowerMsg.includes(String(i.medicine_name || "").toLowerCase())
    );

    if (specific) {
      const qty = Number(specific.quantity || 0);

      return `💊 **${specific.medicine_name}**

Quantity: **${qty} units**
Status: ${qty >= 50 ? "✅ Well stocked" : qty > 0 ? "⚠️ Low stock" : "❌ Out of stock"}`;
    }

    const low = data.items.filter(i => Number(i.quantity || 0) < 50);
    const ok = data.items.filter(i => Number(i.quantity || 0) >= 50);

    return `📦 **Stock Overview**

✅ Well stocked: **${ok.length}**
⚠️ Low stock: **${low.length}**

${low.length ? "Low stock items:\n" + low.map(i => `• ${i.medicine_name} — ${i.quantity} units`).join("\n") : "No low-stock items."}`;
  }

  return `📦 Inventory data unavailable.`;
}

async function getRestockSuggestions() {
  const data = await fetchFromBackend("/inventory");

  if (data && data.items && data.items.length > 0) {
    const low = data.items.filter(i => Number(i.quantity || 0) < 50);

    if (!low.length) {
      return `✅ **Restock Suggestions**

All medicines are currently above minimum stock level.`;
    }

    return `🛒 **Restock Suggestions**

These medicines need restocking:

${low.map(i => `• ${i.medicine_name} — current stock: ${i.quantity} units`).join("\n")}

Suggested action: Raise purchase request for low-stock medicines.`;
  }

  return `📦 Inventory data unavailable.`;
}

// ============================================
// GLOBAL
// ============================================

window.initializeChatbot = initializeChatbot;
window.getChatbotResponse = getChatbotResponse;
window.toggleChatbotWidget = toggleChatbotWidget;

document.addEventListener("DOMContentLoaded", initializeChatbot);
