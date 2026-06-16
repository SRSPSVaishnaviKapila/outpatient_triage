// ============================================
// SYMPTOMPICKER.JS - Visual chip picker & voice input
// ============================================

console.log("🔴 symptomPicker.js is loading...");

// Symptom list
const symptomOptions = [
  { name: "Fever", emoji: "🌡️" },
  { name: "Cough", emoji: "😷" },
  { name: "Cold", emoji: "🤧" },
  { name: "Headache", emoji: "🤕" },
  { name: "Chest Pain", emoji: "💔" },
  { name: "Shortness of Breath", emoji: "🫁" },
  { name: "Abdominal Pain", emoji: "🤰" },
  { name: "Vomiting", emoji: "🤮" },
  { name: "Nausea", emoji: "🥴" },
  { name: "Diarrhea", emoji: "🚽" },
  { name: "Dizziness", emoji: "😵" },
  { name: "Unconsciousness", emoji: "🚨" },
  { name: "Seizures", emoji: "⚡" },
  { name: "Severe Bleeding", emoji: "🩸" },
  { name: "Body Pain", emoji: "🦴" },
  { name: "Back Pain", emoji: "🧍" },
  { name: "Joint Pain", emoji: "🦵" },
  { name: "Rash", emoji: "🩹" },
  { name: "Ear Pain", emoji: "👂" },
  { name: "Sore Throat", emoji: "🗣️" },
  { name: "Tooth Pain", emoji: "🦷" },
  { name: "Burning Urination", emoji: "💧" },
  { name: "Frequent Urination", emoji: "🚽" },
  { name: "Weakness", emoji: "🛌" },
  { name: "Fatigue", emoji: "😴" },
  { name: "Chills", emoji: "🥶" },
  { name: "Swelling", emoji: "🔵" },
  { name: "Injury", emoji: "🩹" },
  { name: "Burns", emoji: "🔥" },
  { name: "High Blood Pressure", emoji: "📈" },
  { name: "Low Blood Pressure", emoji: "📉" },
  { name: "Blurred Vision", emoji: "👁️" },
  { name: "Muscle Pain", emoji: "💪" },
  { name: "Neck Pain", emoji: "🧣" },
  { name: "Shoulder Pain", emoji: "🦾" },
  { name: "Hip Pain", emoji: "🦿" },
  { name: "Ankle Pain", emoji: "🦶" },
  { name: "Wrist Pain", emoji: "🤚" },
  { name: "Allergies", emoji: "🤧" },
  { name: "Sinus Pressure", emoji: "😤" },
  { name: "Dehydration", emoji: "💦" },
  { name: "Anxiety", emoji: "😰" },
  { name: "Depression", emoji: "😞" },
  { name: "Insomnia", emoji: "😳" },
  { name: "Night Sweats", emoji: "💦" },
  { name: "Weight Loss", emoji: "⚖️" },
  { name: "Weight Gain", emoji: "📈" },
  { name: "Loss of Appetite", emoji: "🍽️" },
  { name: "Excessive Thirst", emoji: "🥤" },
  { name: "Constipation", emoji: "🚫" },
  { name: "Heartburn", emoji: "🔥" },
  { name: "Acid Reflux", emoji: "⬆️" }
];

console.log("✅ symptomOptions loaded:", symptomOptions.length);

// Update textarea with selected symptoms
function updateSymptomsTextarea() {
  const selected = [...document.querySelectorAll(".symptom-chip.selected")]
    .map(chip => chip.dataset.symptom);

  const textarea = document.getElementById("symptoms");
  if (textarea) {
    textarea.value = selected.join(", ");
    textarea.dispatchEvent(new Event('input'));
  }
}

// Render symptom picker
function renderSymptomPicker() {
  console.log("🎨 renderSymptomPicker called");
  
  const grid = document.getElementById("symptomGrid");
  if (!grid) {
    console.error("❌ symptomGrid element not found!");
    return;
  }
  
  console.log("✅ symptomGrid found, rendering", symptomOptions.length, "symptoms");
  
  // Clear the grid
  grid.innerHTML = "";
  
  // Show the visual picker container
  const visualPicker = document.getElementById("visualPicker");
  if (visualPicker) {
    visualPicker.classList.remove("hidden");
    visualPicker.style.display = "block";
    visualPicker.style.visibility = "visible";
    visualPicker.style.opacity = "1";
  }
  
  // Create symptom chips
  symptomOptions.forEach(symptom => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "symptom-chip";
    chip.dataset.symptom = symptom.name;
    chip.innerHTML = `<span class="symptom-icon">${symptom.emoji}</span> ${symptom.name}`;
    
    chip.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.toggle("selected");
      updateSymptomsTextarea();
    });
    
    grid.appendChild(chip);
  });
  
  console.log(`✅ Rendered ${symptomOptions.length} symptom chips in grid`);
}

// Setup voice input
function setupVoiceInput() {
  console.log("🎤 setupVoiceInput called");
  const startBtn = document.getElementById("startVoice");
  const status = document.getElementById("voiceStatus");

  if (!startBtn) {
    console.warn("⚠️ startVoice button not found");
    return;
  }

  const newBtn = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(newBtn, startBtn);

  newBtn.addEventListener("click", function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (status) {
        status.textContent = "❌ Voice not supported. Use Chrome or Edge.";
        status.style.color = "#dc2626";
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    this.disabled = true;
    this.textContent = "🎙️ Listening...";
    if (status) {
      status.textContent = "🎤 Listening... speak your symptoms.";
      status.style.color = "#0f766e";
    }

    recognition.start();

    recognition.onresult = event => {
      const text = event.results[0][0].transcript;
      const textarea = document.getElementById("symptoms");

      if (textarea) {
        textarea.value = textarea.value.trim()
          ? textarea.value.trim() + ", " + text
          : text;
        textarea.dispatchEvent(new Event('input'));
      }

      if (status) {
        status.textContent = "✅ Voice captured!";
        status.style.color = "#16a34a";
      }
      this.textContent = "🎤 Start Voice Input";
      this.disabled = false;
    };

    recognition.onerror = function() {
      if (status) {
        status.textContent = "⚠️ Voice failed. Please try again.";
        status.style.color = "#dc2626";
      }
      newBtn.textContent = "🎤 Start Voice Input";
      newBtn.disabled = false;
    };

    recognition.onend = () => {
      this.disabled = false;
      this.textContent = "🎤 Start Voice Input";
    };
  });
  
  console.log("✅ Voice input setup complete");
}

// ============================================
// EXPLICITLY EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.symptomOptions = symptomOptions;
window.renderSymptomPicker = renderSymptomPicker;
window.setupVoiceInput = setupVoiceInput;
window.updateSymptomsTextarea = updateSymptomsTextarea;

console.log("✅ symptomPicker.js loaded, functions exposed to window");
console.log("✅ window.renderSymptomPicker:", typeof window.renderSymptomPicker);
console.log("✅ window.setupVoiceInput:", typeof window.setupVoiceInput);

// Auto-initialize
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("🚀 DOM ready - initializing symptom picker");
      setupVoiceInput();
      renderSymptomPicker();
    });
  } else {
    console.log("🚀 DOM already ready - initializing symptom picker");
    setupVoiceInput();
    renderSymptomPicker();
  }
})();

// Also render on window load
window.addEventListener('load', function() {
  console.log("🔄 Window load - re-rendering symptom picker");
  renderSymptomPicker();
});
