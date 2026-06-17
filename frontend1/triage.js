//const API_URL = "http://127.0.0.1:8000";
window.lastReport = null;

// ---- Helper Functions ----

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function splitCSV(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

// ---- Priority & Formatting Helpers ----

function priorityClass(priority) {
    return `priority-${String(priority || "low").toLowerCase()}`;
}
const SYMPTOM_GUIDANCE = {
  "fever": "Drink plenty of water, take rest, monitor temperature, and visit PHC if fever persists more than 2 days.",
  "cough": "Drink warm fluids and avoid dust or smoke. Seek medical care if cough lasts more than one week.",
  "cold": "Rest, drink fluids, and avoid cold foods. Visit PHC if symptoms worsen.",
  "headache": "Rest in a quiet room and stay hydrated. Seek care if severe or associated with weakness.",
  "migraine": "Avoid bright lights and loud sounds. Take prescribed medication if available.",
  "dizziness": "Sit down immediately and drink water. Seek help if recurrent.",
  "chest pain": "Chest pain may be serious. Seek immediate medical attention.",
  "shortness of breath": "Difficulty breathing requires urgent medical evaluation.",
  "abdominal pain": "Avoid heavy meals. Seek care if pain is severe or persistent.",
  "vomiting": "Take ORS and small sips of water. Seek care if persistent.",
  "diarrhea": "Use ORS frequently and avoid oily foods.",
  "constipation": "Increase water, fruits, and fiber intake.",
  "dehydration": "Drink ORS and fluids immediately.",
  "seizure": "Keep patient safe and seek emergency care.",
  "unconsciousness": "Emergency condition. Seek immediate medical attention.",
  "bleeding": "Apply pressure and seek urgent care.",
  "burns": "Cool with running water for 20 minutes. Avoid applying creams or toothpaste.",
  "rash": "Avoid scratching and monitor spread.",
  "allergy": "Avoid allergen exposure and seek care if breathing issues occur.",
  "burning urination": "Drink water and get urine tested.",
  "diabetes": "Monitor sugar levels and stay hydrated.",
  "high blood pressure": "Monitor BP and consult a doctor.",
  "heart": "Seek immediate medical attention for chest pain or palpitations.",
  "stroke": "Call emergency services immediately.",
  "anxiety": "Practice deep breathing and relaxation.",
  "depression": "Seek support from family and healthcare professionals.",
  "insomnia": "Maintain sleep hygiene and avoid caffeine at night.",
  "pregnancy": "Visit PHC for pregnancy-related symptoms.",
  "child": "Monitor feeding, urine output, and activity level.",
  "ear pain": "Avoid inserting objects into the ear.",
  "sore throat": "Drink warm fluids and avoid irritants.",
  "tooth pain": "Maintain oral hygiene and visit dentist.",
  "eye pain": "Avoid rubbing eyes and seek care if pain persists.",
  "swelling": "Elevate affected area and monitor.",
  "weakness": "Rest and maintain hydration.",
  "fatigue": "Ensure adequate nutrition and sleep.",
  "fracture": "Immobilize affected area and seek care.",
  "snake bite": "Keep patient calm and seek emergency care immediately.",
  "dog bite": "Wash wound and seek rabies evaluation.",
  "poisoning": "Seek emergency help immediately.",
  "jaundice": "Visit PHC for liver evaluation.",
  "malaria": "Get tested immediately and avoid mosquito exposure.",
  "dengue": "Drink fluids and seek medical evaluation.",
  "tuberculosis": "Seek medical testing and wear a mask.",
  "covid": "Isolate and seek testing if symptoms persist."
};
function getSymptomBasedGuidance(symptoms) {
    const symptomText = (symptoms || []).join(" ").toLowerCase();
    const matchedGuidance = [];

    Object.keys(SYMPTOM_GUIDANCE).forEach(key => {
        if (symptomText.includes(key)) {
            matchedGuidance.push(
                `<p><b>🩺 ${key.toUpperCase()}:</b> ${SYMPTOM_GUIDANCE[key]}</p>`
            );
        }
    });

    if (matchedGuidance.length > 0) {
        return matchedGuidance.join("");
    }

    return `
        <p><b>🩺 General Advice:</b> Monitor symptoms, drink water, take rest, and visit the PHC if symptoms worsen or continue for more than 2 days.</p>
    `;
}
function formatGuidance(guidance) {
    if (!guidance) return "<p>General medical guidance: Monitor symptoms, stay hydrated, take adequate rest.</p>";
    if (typeof guidance === "string") return `<p>${guidance.replace(/\n/g, "<br>")}</p>`;
    return `
        <p><b>📖 Medical insight:</b> ${escapeHtml(guidance.meaning || guidance.description || "Consult physician for proper diagnosis")}</p>
        <p><b>⚠️ Common symptoms:</b> ${escapeHtml(Array.isArray(guidance.common_symptoms) ? guidance.common_symptoms.join(", ") : guidance.common_symptoms || "-")}</p>
        <p><b>🩺 Possible causes:</b> ${escapeHtml(Array.isArray(guidance.possible_causes) ? guidance.possible_causes.join(", ") : guidance.possible_causes || "-")}</p>
        <p><b>🚑 When to seek help:</b> ${escapeHtml(guidance.when_to_seek_medical_attention || guidance.doctor_advice || "Seek immediate medical attention if symptoms worsen")}</p>
    `;
}


function buildSummary(req, data) {
    const existing = req.existing_conditions?.length ? req.existing_conditions.join(", ") : "None";
    const notes = req.additional_notes || "No additional notes";
    return `${req.patient_name} (${req.age} years, ${req.gender}) presents with ${req.symptoms.join(", ")} for ${req.duration_days} day(s). Medical history: ${existing}. Additional notes: ${notes}. AI Prediction: ${data.predicted_disease || "Under evaluation"} | Triage Priority: ${data.priority || "MEDIUM"}.`;
}

// ---- Priority determination ----

function determinePriority(predictedDisease, symptoms, backendPriority) {
    const emergencyTerms = ["emergency", "critical", "heart attack", "stroke", "severe bleeding",
        "unconsciousness", "chest pain", "breathing difficulty", "seizure",
        "cardiac", "respiratory failure", "anaphylaxis"];
    const highTerms = ["pneumonia", "appendicitis", "kidney stone", "uti with fever",
        "severe dehydration", "high fever", "migraine with aura",
        "hypertension crisis", "diabetic ketoacidosis", "sepsis"];

    const diseaseLower = (predictedDisease || "").toLowerCase();
    const symptomsLower = (Array.isArray(symptoms) ? symptoms : []).join(" ").toLowerCase();

    for (const t of emergencyTerms) {
        if (diseaseLower.includes(t) || symptomsLower.includes(t)) return "EMERGENCY";
    }
    for (const t of highTerms) {
        if (diseaseLower.includes(t)) return "HIGH";
    }

    if (symptomsLower.includes("severe") || symptomsLower.includes("unbearable")) return "HIGH";

    if (backendPriority && ["EMERGENCY", "CRITICAL", "HIGH", "MEDIUM"].includes(backendPriority.toUpperCase())) {
        return backendPriority.toUpperCase();
    }

    if (Array.isArray(symptoms) && symptoms.length >= 5) return "MEDIUM";
    return "MEDIUM";
}

// ---- Render full result (doctor / admin) ----

function renderResults(req, data) {
    console.log("Rendering full results...");
    
    const priority = data.priority || "MEDIUM";
    const isEmergency = ["CRITICAL", "EMERGENCY"].includes(priority.toUpperCase());
    const department = data.department || data.doctor_specialization || "General Medicine";
    const medicines = data.recommended_medicines || ["Paracetamol 500mg", "ORS"];
    const redFlags = data.red_flag_detected || data.red_flags || [];
    const summaryText = data.patient_summary || buildSummary(req, data);

    const priorityEmojis = { EMERGENCY: "🚨", CRITICAL: "⚠️", HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };
    const priorityEmoji = priorityEmojis[priority.toUpperCase()] || "🟡";

    const resultsDiv = $("results");
    if (!resultsDiv) {
        console.error("❌ Results div not found in DOM");
        return;
    }

    resultsDiv.innerHTML = `
        ${isEmergency ? `<div class="alert" style="background:#fee2e2; border-left:6px solid #dc2626; padding:18px; border-radius:24px; margin-bottom:22px;"><strong>🚨 EMERGENCY ALERT</strong><br>Immediate medical intervention required</div>` : ""}
        ${redFlags.length ? `<div class="alert" style="background:#fee2e2; border-left:6px solid #dc2626; padding:18px; border-radius:24px; margin-bottom:22px;"><strong>🚩 Red Flags Detected</strong><ul class="list" style="margin-top:8px;">${redFlags.map(f => `<li>⚠️ ${escapeHtml(f)}</li>`).join("")}</ul></div>` : ""}

        <div class="result-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-top:20px;">
            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>📌 Patient Summary</h3>
                <p><strong>${escapeHtml(req.patient_name)}</strong> | ${escapeHtml(String(req.age))} yrs | ${escapeHtml(req.gender)}</p>
                <p><b>Symptoms:</b> ${escapeHtml(req.symptoms.join(", "))}</p>
                <p><b>Duration:</b> ${escapeHtml(String(req.duration_days))} days</p>
                <p><b>Existing conditions:</b> ${escapeHtml(req.existing_conditions?.join(", ") || "None")}</p>
                <p><b>Notes:</b> ${escapeHtml(req.additional_notes || "None")}</p>
            </div>

            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>⚡ Triage Priority</h3>
                <p class="big-priority ${priorityClass(priority)}" style="font-size:32px; font-weight:800; color:#0f766e;">${priorityEmoji} ${escapeHtml(priority)}</p>
                <p><b>Department:</b> ${escapeHtml(department)}</p>
                <p><b>Recommendation:</b> ${escapeHtml(data.recommendation || "Consult doctor immediately")}</p>
            </div>

            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>🧬 AI Prediction</h3>
                <p><b>Likely condition:</b> ${escapeHtml(data.predicted_disease || "Assessment needed")}</p>
                <p><b>Confidence:</b> ${escapeHtml(String(data.confidence_score ?? "—"))}${data.confidence_score ? "%" : ""}</p>
                <p><b>Matched symptoms:</b> ${escapeHtml((data.matched_symptoms || req.symptoms.slice(0, 3)).join(", "))}</p>
            </div>

            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>👨‍⚕️ Assigned Doctor</h3>
                <p><b>Doctor:</b> ${escapeHtml(data.doctor_name || "Dr. General Physician")}</p>
                <p><b>Specialization:</b> ${escapeHtml(department)}</p>
                <p><b>Availability:</b> ${escapeHtml(data.doctor_availability || "Available now")}</p>
            </div>

            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>🎟️ Token & Queue</h3>
                <p><b>Token #:</b> <strong style="font-size:24px;color:#0f766e;">${escapeHtml(String(data.token_number ?? "—"))}</strong></p>
                <p><b>Queue Position:</b> ${escapeHtml(String(data.queue_position ?? "—"))}</p>
                <p><b>Est. Wait:</b> ${escapeHtml(data.estimated_wait_time || "—")}</p>
            </div>

            <div class="card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h3>💊 Medicines & Stock</h3>
                <ul class="list" style="padding-left:20px;">${medicines.map(m => `<li>💊 ${escapeHtml(m)}</li>`).join("")}</ul>
                <p style="margin-top:10px;"><b>Availability:</b>
                    <span style="font-weight:bold;color:${data.medicine_available !== false ? "#16a34a" : "#dc2626"}">
                        ${data.medicine_available !== false ? "✅ In Stock" : "⚠️ Limited Stock"}
                    </span>
                </p>
            </div>

            <div class="card guidance-card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); grid-column: 1/-1;">
                <h3>📚 Medical Guidance</h3>
                <button class="secondary-btn" id="guidanceToggleBtn" style="margin-top:10px; padding:10px 20px; background:#e6fffb; color:#0f766e; border:none; border-radius:8px; cursor:pointer;" type="button">
                    👁️ View Medical Guidance
                </button>
                <div id="guidanceContent" style="display:none;margin-top:15px;">
                    ${formatGuidance(data.guidance)}
                </div>
            </div>

            <div class="card summary-card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); grid-column: 1/-1;">
                <h3>📄 Clinical Summary</h3>
                <p>${escapeHtml(summaryText)}</p>
                <div class="actions" style="display:flex; gap:12px; margin-top:16px;">
                    <button class="primary-btn" id="downloadReportBtn" style="background:#0f766e; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer;" type="button">⬇️ Download Report</button>
                    <button class="secondary-btn" id="printReportBtn" style="background:#e6fffb; color:#0f766e; border:none; padding:12px 24px; border-radius:8px; cursor:pointer;" type="button">🖨️ Print Report</button>
                </div>
            </div>
        </div>
    `;

    // Force display the results
    resultsDiv.classList.remove("hidden");
    resultsDiv.style.display = "block";
    resultsDiv.style.visibility = "visible";
    resultsDiv.style.opacity = "1";
    
    console.log("✅ Results rendered successfully");

    // Attach button handlers
    setTimeout(() => {
        const guidanceBtn = document.getElementById("guidanceToggleBtn");
        if (guidanceBtn) {
            guidanceBtn.addEventListener("click", function () {
                const content = document.getElementById("guidanceContent");
                if (!content) return;
                const hidden = content.style.display === "none" || !content.style.display;
                content.style.display = hidden ? "block" : "none";
                this.textContent = hidden ? "🙈 Hide Medical Guidance" : "👁️ View Medical Guidance";
            });
        }

        const downloadBtn = document.getElementById("downloadReportBtn");
        if (downloadBtn) downloadBtn.addEventListener("click", downloadReport);

        const printBtn = document.getElementById("printReportBtn");
        if (printBtn) printBtn.addEventListener("click", printReport);
    }, 100);

    setTimeout(() => resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
}

// ---- Render patient-only view (token + assigned doctor) ----

function renderPatientTokenOnly(data, req) {
    console.log("Rendering patient token view...");
    
    const resultsDiv = $("results");
    if (!resultsDiv) {
        console.error("❌ Results div not found in DOM");
        return;
    }

    const tokenNum = data.token_number ? String(data.token_number) : "—";
    const queuePos = data.queue_position ? String(data.queue_position) : "—";
    const waitTime = data.estimated_wait_time || "—";
    const doctorName = data.doctor_name || "Doctor assigned at reception";
    const dept = data.department || data.doctor_specialization || "General Medicine";

    resultsDiv.innerHTML = `
        <div style="max-width:560px;margin:30px auto;">
            <div class="card" style="text-align:center;padding:36px; background:white; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="color:#0f766e;margin-bottom:8px;">✅ Triage Submitted</h2>
                <p style="color:#64748b;margin-bottom:24px;">Your details have been recorded. Please wait for your token to be called.</p>

                <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:20px;padding:24px;margin-bottom:20px;">
                    <p style="font-size:13px;color:#64748b;margin-bottom:6px;">Your Token Number</p>
                    <p style="font-size:64px;font-weight:900;color:#0f766e;line-height:1;">${escapeHtml(tokenNum)}</p>
                    <p style="font-size:13px;color:#64748b;margin-top:6px;">Queue Position: <strong>${escapeHtml(queuePos)}</strong></p>
                    <p style="font-size:13px;color:#64748b;">Est. Wait: <strong>${escapeHtml(waitTime)}</strong></p>
                </div>

                <div style="text-align:left;background:#f8fffd; padding:20px; border-radius:12px;">
                    <p><b>👨‍⚕️ Assigned Doctor:</b> ${escapeHtml(doctorName)}</p>
                    <p><b>🏥 Department:</b> ${escapeHtml(dept)}</p>
                </div>

                <div class="card" style="margin-top:20px;text-align:left;background:#ffffff;border-radius:16px;padding:20px;border:1px solid #dbeeea;">
                    <h3 style="color:#0f766e;margin-bottom:10px;">📚 Medical Guidance</h3>

                    <button
                        class="secondary-btn"
                        id="guidanceToggleBtnPatient"
                        type="button"
                        style="margin-top:10px;padding:10px 18px;background:#e6fffb;color:#0f766e;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                        👁️ View Medical Guidance
                    </button>

                    <div id="guidanceContentPatient" style="display:none;margin-top:15px;color:#334155;line-height:1.6;">
                        ${formatGuidance(data.guidance)}
                    </div>
                </div>

                <div class="actions" style="justify-content:center;margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="primary-btn" id="downloadReportBtnPatient" style="background:#0f766e; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer;" type="button">⬇️ Download Report</button>
                    <button class="secondary-btn" id="printReportBtnPatient" style="background:#e6fffb; color:#0f766e; border:none; padding:12px 24px; border-radius:8px; cursor:pointer;" type="button">🖨️ Print Report</button>
                </div>
            </div>
        </div>
    `;

    resultsDiv.classList.remove("hidden");
    resultsDiv.style.display = "block";
    resultsDiv.style.visibility = "visible";
    resultsDiv.style.opacity = "1";
    
    console.log("✅ Patient view rendered successfully");

    setTimeout(() => {
        const dlBtn = document.getElementById("downloadReportBtnPatient");
        const prBtn = document.getElementById("printReportBtnPatient");
        const guideBtn = document.getElementById("guidanceToggleBtnPatient");

        if (dlBtn) dlBtn.addEventListener("click", downloadReport);
        if (prBtn) prBtn.addEventListener("click", printReport);

        if (guideBtn) {
            guideBtn.addEventListener("click", function () {
                const content = document.getElementById("guidanceContentPatient");
                if (!content) return;

                const hidden = content.style.display === "none" || !content.style.display;
                content.style.display = hidden ? "block" : "none";

                this.textContent = hidden
                    ? "🙈 Hide Medical Guidance"
                    : "👁️ View Medical Guidance";
            });
        }
    }, 100);

    resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- Download report ----

function downloadReport() {
    const report = getReport();
    if (!report) { alert("No report available to download."); return; }
    const { request: req, response: res } = report;

    const lines = [
        "PHC OUTPATIENT TRIAGE REPORT",
        "=".repeat(40),
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "PATIENT DETAILS",
        "-".repeat(30),
        `Name       : ${req.patient_name}`,
        `Age        : ${req.age}`,
        `Gender     : ${req.gender}`,
        `Symptoms   : ${req.symptoms.join(", ")}`,
        `Duration   : ${req.duration_days} days`,
        `Conditions : ${req.existing_conditions?.join(", ") || "None"}`,
        `Notes      : ${req.additional_notes || "None"}`,
        "",
        "TRIAGE RESULTS",
        "-".repeat(30),
        `Priority   : ${res.priority}`,
        `Department : ${res.department || "General Medicine"}`,
        `Disease    : ${res.predicted_disease || "—"}`,
        `Confidence : ${res.confidence_score ? res.confidence_score + "%" : "—"}`,
        `Doctor     : ${res.doctor_name || "—"}`,
        `Token #    : ${res.token_number ?? "—"}`,
        `Queue Pos  : ${res.queue_position ?? "—"}`,
        `Wait Time  : ${res.estimated_wait_time || "—"}`,
        `Guidance   : ${typeof res.guidance === "string" ? res.guidance : JSON.stringify(res.guidance || "General guidance")}`,
        "",
        "MEDICINES",
        "-".repeat(30),
        (res.recommended_medicines || []).map(m => `• ${m}`).join("\n"),
        "",
        "SUMMARY",
        "-".repeat(30),
        buildSummary(req, res),
        "",
        "=".repeat(40),
        "PHC Triage System — Confidential Patient Record"
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(req.patient_name || "patient").replace(/\s+/g, "_")}_triage_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// ---- Print report ----

function printReport() {
    const report = getReport();
    if (!report) { alert("No report available to print."); return; }
    const { request: req, response: res } = report;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print."); return; }

    win.document.write(`
        <!DOCTYPE html><html><head><title>PHC Triage Report</title>
        <style>
            body{font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#1e293b;}
            h1{text-align:center;color:#0f766e;margin-bottom:4px;}
            .subtitle{text-align:center;color:#64748b;margin-bottom:24px;font-size:13px;}
            h2{margin-top:22px;border-bottom:2px solid #0f766e;padding-bottom:6px;color:#0f766e;}
            table{width:100%;border-collapse:collapse;margin-top:10px;}
            td,th{border:1px solid #d1e9e6;padding:9px 12px;font-size:14px;}
            th{background:#f0faf8;color:#0f766e;font-weight:700;width:35%;}
            ul{padding-left:20px;}
            .footer{margin-top:30px;text-align:center;font-size:12px;color:#94a3b8;}
            @media print{body{padding:15px;}}
        </style></head><body>
        <h1>PHC OUTPATIENT TRIAGE REPORT</h1>
        <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>

        <h2>Patient Details</h2>
        <table>
            <tr><th>Name</th><td>${escapeHtml(req.patient_name)}</td></tr>
            <tr><th>Age</th><td>${escapeHtml(String(req.age))}</td></tr>
            <tr><th>Gender</th><td>${escapeHtml(req.gender)}</td></tr>
            <tr><th>Symptoms</th><td>${escapeHtml(req.symptoms.join(", "))}</td></tr>
            <tr><th>Duration</th><td>${escapeHtml(String(req.duration_days))} days</td></tr>
            <tr><th>Existing Conditions</th><td>${escapeHtml(req.existing_conditions?.join(", ") || "None")}</td></tr>
            <tr><th>Notes</th><td>${escapeHtml(req.additional_notes || "None")}</td></tr>
        </table>

        <h2>Triage Result</h2>
        <table>
            <tr><th>Priority</th><td><strong>${escapeHtml(res.priority || "—")}</strong></td></tr>
            <tr><th>Department</th><td>${escapeHtml(res.department || "General Medicine")}</td></tr>
            <tr><th>Predicted Disease</th><td>${escapeHtml(res.predicted_disease || "—")}</td></tr>
            <tr><th>Confidence</th><td>${res.confidence_score ? res.confidence_score + "%" : "—"}</td></tr>
            <tr><th>Assigned Doctor</th><td>${escapeHtml(res.doctor_name || "—")}</td></tr>
            <tr><th>Token Number</th><td><strong>${escapeHtml(String(res.token_number ?? "—"))}</strong></td></tr>
            <tr><th>Queue Position</th><td>${escapeHtml(String(res.queue_position ?? "—"))}</td></tr>
            <tr><th>Est. Wait Time</th><td>${escapeHtml(res.estimated_wait_time || "—")}</td></tr>
            <tr><th>Recommendation</th><td>${escapeHtml(res.recommendation || "—")}</td></tr>
        </table>

        <h2>Medicines</h2>
        <ul>${(res.recommended_medicines || []).map(m => `<li>${escapeHtml(m)}</li>`).join("")}</ul>

        <h2>Clinical Summary</h2>
        <p>${escapeHtml(buildSummary(req, res))}</p>

        <p class="footer">PHC Triage System — Confidential Patient Record</p>
        </body></html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 600);
}

function getReport() {
    if (window.lastReport) return window.lastReport;
    try {
        const saved = sessionStorage.getItem("lastResults");
        if (saved) {
            window.lastReport = JSON.parse(saved);
            return window.lastReport;
        }
    } catch (e) { /* ignore */ }
    return null;
}

// ---- Setup form - DIRECT CLICK HANDLER ----

function setupTriageForm() {
    const generateBtn = $("generateBtn");
    
    if (!generateBtn) {
        console.error("❌ Generate button not found! Make sure button has id='generateBtn'");
        // Try to find it in triagePage
        const triagePage = $("triagePage");
        if (triagePage) {
            const btn = triagePage.querySelector("#generateBtn");
            if (btn) {
                console.log("✅ Found generateBtn inside triagePage, attaching handler");
                attachGenerateHandler(btn);
                return;
            }
        }
        return;
    }
    
    console.log("✅ Generate button found, attaching handler");
    attachGenerateHandler(generateBtn);
}

function attachGenerateHandler(btn) {
    // Remove existing handlers
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Attach new handler
    newBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("🖱️ Generate button clicked!");
        
        const patientName = $("patientName")?.value?.trim();
        const age = $("age")?.value;
        const gender = $("gender")?.value;
        const symptoms = $("symptoms")?.value?.trim();

        if (!patientName) { 
            alert("❌ Please enter Patient Name"); 
            $("patientName")?.focus(); 
            return false; 
        }
        if (!age) { 
            alert("❌ Please enter Age"); 
            $("age")?.focus(); 
            return false; 
        }
        if (!gender) { 
            alert("❌ Please select Gender"); 
            $("gender")?.focus(); 
            return false; 
        }
        if (!symptoms) { 
            alert("❌ Please enter at least one Symptom"); 
            $("symptoms")?.focus(); 
            return false; 
        }

        console.log("✅ All validations passed, processing triage...");
        processTriage();
        
        return false;
    });
    
    console.log("✅ Click handler attached to generate button");
}

// ---- Process triage ----

async function processTriage() {
    console.log("🔄 Starting triage processing...");
    
    const patientName = $("patientName").value.trim();
    const age = $("age").value;
    const gender = $("gender").value;
    const symptomsRaw = $("symptoms").value.trim();
    const symptomList = splitCSV(symptomsRaw).length ? splitCSV(symptomsRaw) : ["general complaint"];

    const payload = {
        patient_name: patientName,
        age: Number(age),
        gender: gender,
        symptoms: symptomList,
        duration_days: Number($("durationDays")?.value) || 1,
        additional_notes: $("additionalNotes")?.value.trim() || "",
        existing_conditions: splitCSV($("existingConditions")?.value || "")
    };

    console.log("📤 Sending payload:", payload);

    const loadingDiv = $("loading");
    const resultsDiv = $("results");

    if (loadingDiv) {
        loadingDiv.classList.remove("hidden");
        console.log("✅ Loading indicator shown");
    }
    
    if (resultsDiv) {
        resultsDiv.classList.add("hidden");
        resultsDiv.innerHTML = "";
    }

    try {
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 15000);

        console.log("📡 Fetching from:", `${API_URL}/triage`);
        
        const response = await fetch(`${API_URL}/triage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timerId);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const raw = await response.json();
        console.log("✅ Triage response received:", raw);

        const priority = determinePriority(raw.predicted_disease, symptomList, raw.priority);

        const finalData = {
            priority,
            recommendation: raw.recommendation || "Consult doctor",
            guidance: getSymptomBasedGuidance(symptomList),
            matched_symptoms: raw.matched_symptoms || symptomList,
            predicted_disease: raw.predicted_disease || "Under Evaluation",
            confidence_score: raw.confidence_score ?? null,
            department: raw.department || raw.doctor_specialization || "General Medicine",
            doctor_name: raw.doctor_name || "Dr. General Physician",
            doctor_specialization: raw.doctor_specialization || "General Medicine",
            doctor_availability: raw.doctor_availability || "Available",
            token_number: raw.token_number ?? Math.floor(Math.random() * 50) + 1,
            queue_position: raw.queue_position ?? Math.floor(Math.random() * 10) + 1,
            estimated_wait_time: raw.estimated_wait_time || `${Math.floor(Math.random() * 30) + 10} minutes`,
            recommended_medicines: raw.recommended_medicines || ["Paracetamol 500mg"],
            medicine_available: raw.medicine_available !== false,
            red_flag_detected: raw.red_flag_detected || raw.red_flags || [],
            patient_summary: raw.patient_summary || null
        };

        const reportData = { request: payload, response: finalData };
        try {
            sessionStorage.setItem("lastResults", JSON.stringify(reportData));
            console.log("✅ Report saved to sessionStorage");
        } catch (e) { 
            console.warn("Could not save to sessionStorage:", e);
        }
        window.lastReport = reportData;

        const role = localStorage.getItem("userRole");
        console.log("👤 User role:", role);
        
        if (role === "patient") {
            console.log("📋 Rendering patient token view");
            renderPatientTokenOnly(finalData, payload);
        } else {
            console.log("📋 Rendering full results view");
            renderResults(payload, finalData);
        }

        // Refresh tables if visible
        if (typeof loadTokens === "function") setTimeout(loadTokens, 200);
        if (typeof loadPatients === "function") setTimeout(loadPatients, 200);

    } catch (err) {
        console.error("❌ Triage error:", err);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="alert" style="background:#fee2e2; border-left:6px solid #dc2626; padding:18px; border-radius:24px;">
                    ❌ <strong>Error processing triage request</strong><br><br>
                    ${escapeHtml(err.message)}<br><br>
                    <small>Ensure the backend is running at <strong>${API_URL}</strong></small>
                </div>`;
            resultsDiv.classList.remove("hidden");
            resultsDiv.style.display = "block";
        }
    } finally {
        if (loadingDiv) {
            loadingDiv.classList.add("hidden");
            console.log("✅ Loading indicator hidden");
        }
    }
}

// Initialize on page load
console.log("🚀 Initializing triage system...");
setupTriageForm();

// Also initialize when DOM is ready (in case script loads before DOM)
document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM fully loaded, setting up triage form...");
    setupTriageForm();
    
    // Restore results if they exist
    const savedResults = sessionStorage.getItem('lastResults');
    if (savedResults) {
        try {
            const saved = JSON.parse(savedResults);
            window.lastReport = saved;
            const role = localStorage.getItem("userRole");
            if (role === "patient") {
                renderPatientTokenOnly(saved.response, saved.request);
            } else {
                renderResults(saved.request, saved.response);
            }
        } catch(e) {
            console.error("Error restoring results:", e);
        }
    }
});
