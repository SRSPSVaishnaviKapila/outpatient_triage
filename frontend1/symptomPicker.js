// ============================================
// SYMPTOMPICKER.JS - Visual chip picker & voice input
// ============================================

console.log("🔴 symptomPicker.js is loading...");

// Symptom list
const symptomOptions = [
  { name: "Fever", telugu: "జ్వరం", emoji: "🌡️" },
  { name: "High Fever", telugu: "అధిక జ్వరం", emoji: "🌡️" },
  { name: "Low Grade Fever", telugu: "తక్కువ జ్వరం", emoji: "🌡️" },
  { name: "Cough", telugu: "దగ్గు", emoji: "😷" },
  { name: "Dry Cough", telugu: "పొడి దగ్గు", emoji: "😷" },
  { name: "Wet Cough", telugu: "కఫంతో దగ్గు", emoji: "😷" },
  { name: "Cold", telugu: "జలుబు", emoji: "🤧" },
  { name: "Runny Nose", telugu: "ముక్కు కారడం", emoji: "👃" },
  { name: "Blocked Nose", telugu: "ముక్కు మూసుకుపోవడం", emoji: "👃" },
  { name: "Sneezing", telugu: "తుమ్ములు", emoji: "🤧" },

  { name: "Headache", telugu: "తలనొప్పి", emoji: "🤕" },
  { name: "Migraine", telugu: "మైగ్రేన్", emoji: "🤕" },
  { name: "Dizziness", telugu: "తల తిరగడం", emoji: "😵" },
  { name: "Vertigo", telugu: "తిరుగుడు భావన", emoji: "🌀" },
  { name: "Confusion", telugu: "గందరగోళం", emoji: "🤯" },
  { name: "Memory Loss", telugu: "జ్ఞాపకశక్తి తగ్గడం", emoji: "🧠" },
  { name: "Unconsciousness", telugu: "స్పృహ కోల్పోవడం", emoji: "🚨" },
  { name: "Seizures", telugu: "మూర్ఛ", emoji: "⚡" },
  { name: "Numbness", telugu: "మొద్దుబారడం", emoji: "🖐️" },
  { name: "Tremors", telugu: "వణుకు", emoji: "🤲" },

  { name: "Chest Pain", telugu: "ఛాతి నొప్పి", emoji: "💔" },
  { name: "Palpitations", telugu: "గుండె వేగంగా కొట్టుకోవడం", emoji: "❤️" },
  { name: "Rapid Heart Rate", telugu: "గుండె వేగం ఎక్కువ", emoji: "❤️" },
  { name: "Slow Heart Rate", telugu: "గుండె వేగం తక్కువ", emoji: "💓" },
  { name: "Shortness of Breath", telugu: "శ్వాస తీసుకోవడంలో ఇబ్బంది", emoji: "🫁" },
  { name: "Wheezing", telugu: "పీల్చేటప్పుడు శబ్దం", emoji: "🫁" },

  { name: "Abdominal Pain", telugu: "కడుపు నొప్పి", emoji: "🤰" },
  { name: "Stomach Pain", telugu: "పొట్ట నొప్పి", emoji: "🤰" },
  { name: "Stomach Cramps", telugu: "కడుపు ముల్లు", emoji: "🤰" },
  { name: "Vomiting", telugu: "వాంతులు", emoji: "🤮" },
  { name: "Nausea", telugu: "వాంతి భావన", emoji: "🥴" },
  { name: "Diarrhea", telugu: "విరేచనాలు", emoji: "🚽" },
  { name: "Constipation", telugu: "మలబద్ధకం", emoji: "🚫" },
  { name: "Bloating", telugu: "కడుపు ఉబ్బరం", emoji: "🎈" },
  { name: "Gas Trouble", telugu: "గ్యాస్ సమస్య", emoji: "💨" },
  { name: "Heartburn", telugu: "ఛాతిలో మంట", emoji: "🔥" },
  { name: "Acid Reflux", telugu: "ఆమ్లం పైకి రావడం", emoji: "⬆️" },

  { name: "Ear Pain", telugu: "చెవి నొప్పి", emoji: "👂" },
  { name: "Ear Discharge", telugu: "చెవిలో నుంచి ద్రవం రావడం", emoji: "👂" },
  { name: "Hearing Loss", telugu: "వినికిడి తగ్గడం", emoji: "🔇" },
  { name: "Sore Throat", telugu: "గొంతు నొప్పి", emoji: "🗣️" },
  { name: "Difficulty Swallowing", telugu: "మింగడంలో ఇబ్బంది", emoji: "🥤" },
  { name: "Sinus Pressure", telugu: "సైనస్ ఒత్తిడి", emoji: "😤" },

  { name: "Eye Pain", telugu: "కంటి నొప్పి", emoji: "👁️" },
  { name: "Red Eyes", telugu: "ఎర్ర కళ్ళు", emoji: "👁️" },
  { name: "Blurred Vision", telugu: "మసక చూపు", emoji: "👁️" },
  { name: "Double Vision", telugu: "రెండు చిత్రాలు కనిపించడం", emoji: "👀" },

  { name: "Tooth Pain", telugu: "పంటి నొప్పి", emoji: "🦷" },
  { name: "Gum Bleeding", telugu: "దంత మాంసం నుంచి రక్తం", emoji: "🩸" },
  { name: "Mouth Ulcers", telugu: "నోటి పుండ్లు", emoji: "👄" },

  { name: "Burning Urination", telugu: "మూత్రం సమయంలో మంట", emoji: "💧" },
  { name: "Frequent Urination", telugu: "తరచూ మూత్రం", emoji: "🚽" },
  { name: "Blood in Urine", telugu: "మూత్రంలో రక్తం", emoji: "🩸" },

  { name: "Body Pain", telugu: "శరీర నొప్పి", emoji: "🦴" },
  { name: "Back Pain", telugu: "వెన్ను నొప్పి", emoji: "🧍" },
  { name: "Neck Pain", telugu: "మెడ నొప్పి", emoji: "🧣" },
  { name: "Shoulder Pain", telugu: "భుజం నొప్పి", emoji: "🦾" },
  { name: "Hip Pain", telugu: "నడుము నొప్పి", emoji: "🦿" },
  { name: "Knee Pain", telugu: "మోకాలి నొప్పి", emoji: "🦵" },
  { name: "Joint Pain", telugu: "కీళ్ల నొప్పి", emoji: "🦵" },
  { name: "Ankle Pain", telugu: "కాలి మడమ నొప్పి", emoji: "🦶" },

  { name: "Rash", telugu: "దద్దుర్లు", emoji: "🩹" },
  { name: "Itching", telugu: "దురద", emoji: "🤚" },
  { name: "Skin Infection", telugu: "చర్మ సంక్రమణ", emoji: "🦠" },
  { name: "Acne", telugu: "మొటిమలు", emoji: "😶" },

  { name: "Allergies", telugu: "అలర్జీ", emoji: "🤧" },
  { name: "Dehydration", telugu: "నీరు తగ్గడం", emoji: "💦" },
  { name: "Chills", telugu: "చలి వేయడం", emoji: "🥶" },
  { name: "Weight Loss", telugu: "బరువు తగ్గడం", emoji: "⚖️" },
  { name: "Weight Gain", telugu: "బరువు పెరగడం", emoji: "📈" },

  { name: "High Blood Pressure", telugu: "అధిక రక్తపోటు", emoji: "📈" },
  { name: "Low Blood Pressure", telugu: "తక్కువ రక్తపోటు", emoji: "📉" },
  { name: "Diabetes Symptoms", telugu: "మధుమేహ లక్షణాలు", emoji: "🩺" },
  { name: "Excessive Thirst", telugu: "అధిక దాహం", emoji: "🥤" },

  { name: "Anxiety", telugu: "ఆందోళన", emoji: "😰" },
  { name: "Depression", telugu: "నిరాశ", emoji: "😞" },
  { name: "Stress", telugu: "ఒత్తిడి", emoji: "😫" },
  { name: "Insomnia", telugu: "నిద్రలేమి", emoji: "😳" },

  { name: "Injury", telugu: "గాయం", emoji: "🩹" },
  { name: "Severe Bleeding", telugu: "తీవ్ర రక్తస్రావం", emoji: "🩸" },
  { name: "Burns", telugu: "కాలిన గాయాలు", emoji: "🔥" },
  { name: "Fracture", telugu: "ఎముక విరగడం", emoji: "🦴" },
  { name: "Snake Bite", telugu: "పాము కాటు", emoji: "🐍" },
  { name: "Dog Bite", telugu: "కుక్క కాటు", emoji: "🐕" },

  { name: "Pregnancy Pain", telugu: "గర్భధారణ నొప్పి", emoji: "🤰" },
  { name: "Heavy Menstrual Bleeding", telugu: "అధిక రుతుస్రావం", emoji: "🩸" },

  { name: "Child Crying", telugu: "పిల్ల ఏడవడం", emoji: "👶" },
  { name: "Child Fever", telugu: "పిల్లకు జ్వరం", emoji: "👶" },
  { name: "Poor Feeding", telugu: "పాలు తాగకపోవడం", emoji: "🍼" },
  { name: "Fever with Chills", telugu: "చలితో జ్వరం", emoji: "🥶" },
  { name: "Typhoid Symptoms", telugu: "టైఫాయిడ్ లక్షణాలు", emoji: "🌡️" },
{ name: "Malaria Symptoms", telugu: "మలేరియా లక్షణాలు", emoji: "🦟" },
{ name: "Dengue Symptoms", telugu: "డెంగ్యూ లక్షణాలు", emoji: "🦟" },
{ name: "COVID Symptoms", telugu: "కోవిడ్ లక్షణాలు", emoji: "😷" },
{ name: "Tuberculosis Symptoms", telugu: "క్షయవ్యాధి లక్షణాలు", emoji: "🫁" },
{ name: "Jaundice", telugu: "కామెర్లు", emoji: "🟡" },
{ name: "Vomiting Blood", telugu: "రక్త వాంతులు", emoji: "🩸" },
{ name: "Blood in Stool", telugu: "మలంలో రక్తం", emoji: "🩸" },
{ name: "Severe Dehydration", telugu: "తీవ్ర నీటి లోపం", emoji: "💦" },
{ name: "Loss of Smell", telugu: "వాసన తెలియకపోవడం", emoji: "👃" },
{ name: "Loss of Taste", telugu: "రుచి తెలియకపోవడం", emoji: "👅" },
{ name: "Leg Swelling", telugu: "కాలి వాపు", emoji: "🦵" },
{ name: "Hand Swelling", telugu: "చేతి వాపు", emoji: "✋" },
{ name: "Yellow Eyes", telugu: "కళ్ళు పసుపు రంగులో ఉండటం", emoji: "🟡" },
{ name: "Yellow Skin", telugu: "చర్మం పసుపు రంగులో ఉండటం", emoji: "🟡" },
{ name: "Bed Wetting", telugu: "పడకలో మూత్రం చేయడం", emoji: "🛏️" },
{ name: "Poor Feeding", telugu: "పాలు తాగకపోవడం", emoji: "🍼" },
{ name: "Child Breathing Problem", telugu: "పిల్లలకు శ్వాస సమస్య", emoji: "👶" },
{ name: "Child Diarrhea", telugu: "పిల్లలకు విరేచనాలు", emoji: "👶" }
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
    chip.innerHTML = `
  <span class="symptom-icon">${symptom.emoji}</span>
  <span class="symptom-en">${symptom.name}</span>
  <span class="symptom-te">${symptom.telugu || ""}</span>
`;
    
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
