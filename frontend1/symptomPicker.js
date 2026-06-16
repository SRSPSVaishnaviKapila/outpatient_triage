// ============================================
// SYMPTOMPICKER.JS - Visual chip picker & voice input
// ============================================

function renderSymptomPicker() {
  const grid = $("symptomGrid");
  if (!grid) return;

  grid.innerHTML = symptomOptions.map(s => `
    <button type="button" class="symptom-chip" data-symptom="${escapeHtml(s.name)}">
      <span class="symptom-icon">${s.emoji}</span>
      <span>${escapeHtml(s.name)}</span>
    </button>
  `).join("");

  grid.querySelectorAll(".symptom-chip").forEach(chip => {
    chip.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      chip.classList.toggle("selected");
      const selected = [...document.querySelectorAll(".symptom-chip.selected")]
        .map(c => c.dataset.symptom);
      const ta = $("symptoms");
      if (ta) ta.value = selected.join(", ");
    });
  });
}

function setupVoiceInput() {
  const startBtn = $("startVoice");
  if (!startBtn) return;

  startBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const statusEl = $("voiceStatus");

    if (!SpeechRecognition) {
      if (statusEl) statusEl.textContent = "❌ Voice not supported. Please use Chrome or Edge.";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (statusEl) statusEl.textContent = "🎤 Listening… speak your symptoms clearly.";

    recognition.start();

    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      const ta = $("symptoms");
      if (ta) {
        ta.value = ta.value.trim()
          ? ta.value.trim() + ", " + transcript
          : transcript;
      }
      if (statusEl) statusEl.textContent = "✅ Voice captured! Edit above if needed.";
    };

    recognition.onerror = () => {
      if (statusEl) statusEl.textContent = "⚠️ Voice error. Please try again or type manually.";
    };
  });
}