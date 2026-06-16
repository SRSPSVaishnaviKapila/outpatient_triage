// ============================================
// CHATBOT.JS - Role-based AI assistant
// ============================================

let chatbotIsOpen = false;

let chatbotSession = {
  active: false,
  symptom: null,
  step: 0,
  collectedData: { duration: null, severity: null, additionalSymptoms: [] }
};

const CONTACT_INFO = {
  reception: "📞 PHC Reception: +91-XXXXXXXXXX",
  emergency: "🚨 Emergency: 108 or +91-XXXXXXXXXX",
  pharmacy:  "💊 Pharmacy: +91-XXXXXXXXXX",
  ambulance: "🚑 Ambulance: 108"
};

// ---- Init ----

function initializeChatbot() {
  const widget    = document.getElementById("chatbotWidget");
  const toggleBtn = document.getElementById("chatbotToggle");
  const header    = document.getElementById("chatbotHeader");
  const sendBtn   = document.getElementById("chatbotSendBtn");
  const input     = document.getElementById("chatbotInput");

  if (!widget) return;

  // Start CLOSED
  widget.classList.add("collapsed");
  chatbotIsOpen = false;
  if (toggleBtn) toggleBtn.textContent = "+";

  // Toggle via header click
  if (header) {
    header.addEventListener("click", function (e) {
      if (e.target.closest(".chatbot-toggle")) return;
      toggleChatbotWidget();
    });
  }

  // Toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleChatbotWidget();
    });
  }

  // Send on button click or Enter
  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => sendChatMessage(input));
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") { e.preventDefault(); sendChatMessage(input); }
    });
  }
}

function toggleChatbotWidget() {
  const widget    = document.getElementById("chatbotWidget");
  const toggleBtn = document.getElementById("chatbotToggle");
  if (!widget) return;
  widget.classList.toggle("collapsed");
  chatbotIsOpen = !widget.classList.contains("collapsed");
  if (toggleBtn) toggleBtn.textContent = chatbotIsOpen ? "−" : "+";
}

window.toggleChatbot = toggleChatbotWidget;

// ---- Message handling ----

async function sendChatMessage(inputEl) {
  const text = inputEl.value.trim();
  if (!text) return;
  addChatMessage(text, "user");
  inputEl.value = "";
  showChatTyping();
  const response = await getChatbotResponse(text);
  hideChatTyping();
  addChatMessage(response, "bot");
}

function addChatMessage(text, sender) {
  const container = document.getElementById("chatbotMessages");
  if (!container) return;

  const div   = document.createElement("div");
  div.className = `message ${sender}`;
  const content = document.createElement("div");
  content.className = "message-content";
  // Allow limited formatting via innerHTML for bot, escape user input
  if (sender === "bot") {
    content.innerHTML = text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
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

// ---- Response logic ----

function resetChatbotSession() {
  chatbotSession = {
    active: false, symptom: null, step: 0,
    collectedData: { duration: null, severity: null, additionalSymptoms: [] }
  };
}

async function getChatbotResponse(message) {
  const role     = localStorage.getItem("userRole") || "patient";
  const lowerMsg = message.toLowerCase();

  // Emergency check
  const emergencyWords = ["emergency","urgent","critical","dying","accident","severe bleeding","unconscious","heart attack","stroke"];
  if (emergencyWords.some(w => lowerMsg.includes(w))) {
    return `🚨 **EMERGENCY ALERT**\n\nPlease seek immediate medical attention!\n\n${CONTACT_INFO.emergency}\n${CONTACT_INFO.ambulance}`;
  }

  // Greeting
  if (/^(hi|hello|hey|namaste|help)\b/.test(lowerMsg)) {
    return getRoleGreeting(role);
  }

  // Role-specific flows
  if (role === "inventory") return await inventoryFlow(lowerMsg);
  if (role === "doctor")    return await doctorFlow(lowerMsg);
  return await patientFlow(lowerMsg, message); // patient (default)
}

function getRoleGreeting(role) {
  const greetings = {
    patient: `👋 **Hello! I'm your PHC Health Assistant.**\n\nI can help with:\n• 🤒 Symptoms & guidance\n• 💊 Medicine availability\n• 👨‍⚕️ Doctor availability\n• 🎫 Token & queue help\n\nHow can I assist you today?`,
    doctor:  `👋 **Hello Doctor!**\n\nI can help with:\n• 📋 Patient records\n• 🎫 Token queue status\n• ⚡ High-priority patients\n• 💊 Inventory lookup\n\nHow can I assist?`,
    inventory: `👋 **Hello Inventory Staff!**\n\nI can help with:\n• 📦 Medicine stock levels\n• ⚠️ Low stock alerts\n• ✅ Availability checks\n\nHow can I assist?`
  };
  return greetings[role] || greetings.patient;
}

// -- Patient flow --

async function patientFlow(lowerMsg, rawMsg) {
  // Follow-up in active session
  if (chatbotSession.active && chatbotSession.symptom) {
    return processFollowUp(rawMsg, chatbotSession.symptom);
  }

  // Symptom detection
  const matched = symptomOptions.find(s => lowerMsg.includes(s.name));
  if (matched) {
    chatbotSession.active  = true;
    chatbotSession.symptom = matched.name;
    chatbotSession.step    = 1;
    return `🩺 **I understand you have ${matched.name}.**\n\n📅 **How many days have you had this symptom?**`;
  }

  // Medicine
  if (lowerMsg.includes("medicine") || lowerMsg.includes("tablet") || lowerMsg.includes("drug") || lowerMsg.includes("stock")) {
    const inv = await fetchFromBackend("/inventory");
    if (inv && inv.items && inv.items.length > 0) {
      const inStock = inv.items.filter(i => {
        const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
        return qty >= 50;
      });
      const low = inv.items.filter(i => {
        const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
        return qty < 50;
      });
      return `💊 **Medicine Availability:**\n\n✅ In Stock: ${inStock.map(i => i.medicine_name).join(", ") || "—"}\n⚠️ Low Stock: ${low.map(i => i.medicine_name).join(", ") || "None"}\n\n${CONTACT_INFO.pharmacy}`;
    }
    return `💊 **Common Medicines Available:**\n\n• Paracetamol 500mg — ✅ In Stock\n• Ibuprofen — ✅ In Stock\n• Cough Syrup — ✅ In Stock\n• ORS Packets — ✅ In Stock\n\n${CONTACT_INFO.pharmacy}`;
  }

  // Doctor
  if (lowerMsg.includes("doctor") || lowerMsg.includes("specialist") || lowerMsg.includes("physician")) {
    const doc = await fetchFromBackend("/doctors");
    if (doc && doc.doctors && doc.doctors.length > 0) {
      const list = doc.doctors.map(d => `• ${d.doctor_name} — ${d.specialization} (${d.availability})`).join("\n");
      return `👨‍⚕️ **Available Doctors:**\n\n${list}\n\n${CONTACT_INFO.reception}`;
    }
    return `👨‍⚕️ **Doctor Information:**\n\nPlease contact reception for current doctor availability.\n\n${CONTACT_INFO.reception}`;
  }

  // Token
  if (lowerMsg.includes("token") || lowerMsg.includes("queue") || lowerMsg.includes("wait")) {
    const tok = await fetchFromBackend("/tokens");
    if (tok && tok.tokens && tok.tokens.length > 0) {
      const active = tok.tokens.filter(t => {
        const st = String(t.status || "").toLowerCase();
        return st.includes("queue") || st.includes("wait");
      }).length;
      return `🎫 **Token Queue Status:**\n\nCurrently **${active}** patient(s) waiting.\n\nAfter submitting your symptoms, your token number will be shown on screen. Please wait until your token is called at reception.`;
    }
    return `🎫 **Token Help:**\n\nAfter submitting symptoms via the Triage page, your token number will appear on screen.\n\nPlease wait until your token is called at reception.`;
  }

  return `🤔 **I didn't quite understand that.**\n\nI can help with:\n• Symptoms (e.g., "I have fever")\n• Medicine availability\n• Doctor information\n• Token / queue status\n\n${CONTACT_INFO.reception}`;
}

function processFollowUp(message, symptom) {
  const lowerMsg = message.toLowerCase();

  if (chatbotSession.step === 1) {
    const match = message.match(/\d+/);
    chatbotSession.collectedData.duration = match ? match[0] + " days" : message;
    chatbotSession.step = 2;
    return `✅ Noted — **${chatbotSession.collectedData.duration}**.\n\n⚠️ **How severe is your ${symptom}?**\n(Reply: Mild / Moderate / Severe)`;
  }

  if (chatbotSession.step === 2) {
    chatbotSession.collectedData.severity = lowerMsg.includes("mild") ? "Mild"
      : lowerMsg.includes("severe") ? "Severe" : "Moderate";
    chatbotSession.step = 3;
    return `✅ Noted — **${chatbotSession.collectedData.severity}**.\n\n🤒 **Any other symptoms?** (Type 'none' if no others)`;
  }

  if (chatbotSession.step === 3) {
    const others = lowerMsg === "none" ? [] : message.split(",").map(s => s.trim()).filter(Boolean);
    chatbotSession.collectedData.additionalSymptoms = others;
    resetChatbotSession();

    return `📋 **Assessment Summary for ${symptom.toUpperCase()}:**\n\n• Duration: ${chatbotSession.collectedData?.duration || message}\n• Severity: ${chatbotSession.collectedData?.severity || "Moderate"}\n• Other symptoms: ${others.length ? others.join(", ") : "None"}\n\n💊 **Recommendation:** Please visit the Triage page to submit your symptoms for a full AI assessment and token.\n\n🏠 **While you wait:** Rest, stay hydrated, monitor your temperature.\n\n${CONTACT_INFO.reception}\n${CONTACT_INFO.emergency}`;
  }

  resetChatbotSession();
  return `Please visit the Triage page to submit your symptoms for a full assessment.`;
}

// -- Doctor flow --

async function doctorFlow(lowerMsg) {
  if (lowerMsg.includes("patient") || lowerMsg.includes("record") || lowerMsg.includes("history")) {
    const data = await fetchFromBackend("/patients");
    if (data && data.patients && data.patients.length > 0) {
      const high = data.patients.filter(p => ["HIGH","EMERGENCY","CRITICAL"].includes(p.severity || p.priority));
      const recent = data.patients.slice(0, 5);
      return `📋 **Patient Records:**\n\n⚡ High Priority: **${high.length}** patients\nTotal Records: **${data.patients.length}**\n\nRecent (5):\n${recent.map(p => `• ${p.patient_name} — ${p.predicted_disease || "—"} (${p.severity || "—"})`).join("\n")}\n\nCheck the Patient History tab for full records.`;
    }
    return `📋 No patient records found yet. Records appear after triage assessments.`;
  }

  if (lowerMsg.includes("token") || lowerMsg.includes("queue")) {
    const data = await fetchFromBackend("/tokens");
    if (data && data.tokens && data.tokens.length > 0) {
      const high = data.tokens.filter(t => ["HIGH","EMERGENCY","CRITICAL"].includes(t.priority));
      return `🎫 **Token Queue:**\n\nTotal waiting: **${data.tokens.length}**\n⚡ High priority: **${high.length}**\n\nHigh Priority Patients:\n${high.slice(0,3).map(t => `• Token #${t.token_number} — ${t.patient_name}`).join("\n") || "None"}\n\nCheck the Tokens tab for the full queue.`;
    }
    return `🎫 No active tokens in the queue currently.`;
  }

  if (lowerMsg.includes("inventory") || lowerMsg.includes("medicine") || lowerMsg.includes("stock")) {
    const data = await fetchFromBackend("/inventory");
    if (data && data.items && data.items.length > 0) {
      const low = data.items.filter(i => {
        const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
        return qty < 50;
      });
      return `💊 **Inventory Status:**\n\nTotal medicines: **${data.items.length}**\n⚠️ Low stock: **${low.length}**${low.length ? "\n\nLow stock items:\n" + low.map(i => `• ${i.medicine_name}`).join("\n") : ""}`;
    }
    return `💊 Inventory data unavailable. Check the Inventory tab.`;
  }

  return `👨‍⚕️ **Doctor Assistant:**\n\nI can help with:\n• Patient records ("show patients")\n• Token queue ("token queue")\n• Inventory ("medicine stock")\n\nOr check the sidebar tabs directly.`;
}

// -- Inventory flow --

async function inventoryFlow(lowerMsg) {
  if (lowerMsg.includes("low") || lowerMsg.includes("alert") || lowerMsg.includes("stock")) {
    const data = await fetchFromBackend("/inventory");
    if (data && data.items && data.items.length > 0) {
      const low = data.items.filter(i => {
        const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
        return qty < 50;
      });
      const ok  = data.items.filter(i => {
        const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
        return qty >= 50;
      });
      return `📦 **Stock Overview:**\n\n✅ Well stocked: **${ok.length}** medicines\n⚠️ Low stock: **${low.length}** medicines${low.length ? "\n\nItems needing restock:\n" + low.map(i => `• ${i.medicine_name} (${i.quantity} units)`).join("\n") : ""}`;
    }
    return `📦 Inventory data unavailable. Check the Inventory tab directly.`;
  }

  if (lowerMsg.includes("paracetamol") || lowerMsg.includes("ibuprofen") || lowerMsg.includes("ors")) {
    const data = await fetchFromBackend("/inventory");
    if (data && data.items) {
      const med = data.items.find(i => i.medicine_name.toLowerCase().includes(lowerMsg.split(" ")[0]));
      if (med) {
        const qty = typeof med.quantity === "number" ? med.quantity : parseInt(med.quantity) || 0;
        return `💊 **${med.medicine_name}:**\n\nQuantity: **${qty} units**\nStatus: ${qty >= 50 ? "✅ In Stock" : "⚠️ Low Stock"}`;
      }
    }
  }

  return `📦 **Inventory Assistant:**\n\nI can help with:\n• Stock levels ("check stock")\n• Low stock alerts ("low stock")\n• Specific medicines ("Paracetamol")\n\nOr use the Inventory tab for full details.`;
}