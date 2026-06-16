// ============================================
// TABLES.JS - Load backend tables cleanly
// ============================================

async function fetchFromBackend(endpoint) {
  try {
    const controller = new AbortController();
    const timerId    = setTimeout(() => controller.abort(), 8000);
    const response   = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timerId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(`Backend ${endpoint} error:`, err.message);
    return null;
  }
}

// ---- SHARED TABLE BUILDER ----

function buildTable(columns, rows) {
  const thead = columns.map(c => `<th>${c}</th>`).join("");
  const tbody = rows.join("");
  return `
    <div style="overflow-x:auto;">
      <table>
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>`;
}

function badge(text, color, bg) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:${color};background:${bg};">${text}</span>`;
}

function errorBox(msg, hint) {
  return `<div style="text-align:center;padding:40px;background:#fee2e2;border-radius:24px;">
    <strong>❌ ${escapeHtml(msg)}</strong><br><br>
    ${hint ? `<span style="color:#64748b;font-size:13px;">${hint}</span>` : ""}
  </div>`;
}

function emptyBox(msg, hint) {
  return `<div style="text-align:center;padding:40px;background:#fef9c3;border-radius:24px;">
    <strong>${escapeHtml(msg)}</strong><br><br>
    ${hint ? `<span style="color:#64748b;font-size:13px;">${hint}</span>` : ""}
  </div>`;
}

function summaryRow(cells) {
  return `<tr style="background:#f0faf8;font-weight:700;">${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
}

// ---- INVENTORY ----

async function loadInventory() {
  const container = $("inventoryTable");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;">🔄 Loading inventory…</div>`;

  const data = await fetchFromBackend("/inventory");

  if (!data || !data.items || data.items.length === 0) {
    container.innerHTML = errorBox(
      "Unable to load inventory from backend",
      `Check the backend server at <strong>${API_URL}</strong> and ensure /inventory returns data.`
    );
    return;
  }

  const items = data.items;
  const lowStockCount = items.filter(i => {
    const qty = typeof i.quantity === "number" ? i.quantity : parseInt(i.quantity) || 0;
    return qty < 50;
  }).length;

  const rows = items.map(item => {
    const qty    = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity) || 0;
    const isLow  = qty < 50;
    const status = isLow
      ? badge("⚠️ Limited Stock", "#9a3412", "#fed7aa")
      : badge("✅ In Stock",      "#065f46", "#d1fae5");
    return `<tr>
      <td><strong>${escapeHtml(item.medicine_name)}</strong></td>
      <td>${escapeHtml(String(qty))} units</td>
      <td>${status}</td>
    </tr>`;
  });

  rows.push(summaryRow([
    "📊 Summary",
    `Total: <strong>${items.length}</strong> medicines`,
    `⚠️ Low Stock: <strong>${lowStockCount}</strong>`
  ]));

  container.innerHTML = buildTable(
    ["💊 Medicine Name", "📦 Quantity", "📊 Status"],
    rows
  );
}

// ---- DOCTORS ----

async function loadDoctors() {
  const container = $("doctorsTable");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;">🔄 Loading doctors…</div>`;

  const data = await fetchFromBackend("/doctors");

  if (!data || !data.doctors || data.doctors.length === 0) {
    container.innerHTML = errorBox(
      "Unable to load doctors from backend",
      `Check the backend server at <strong>${API_URL}</strong> and ensure /doctors returns data.`
    );
    return;
  }

  const doctors       = data.doctors;
  const availableCount = doctors.filter(d =>
    d.availability === "Available" || d.availability === "Available Today"
  ).length;

  const rows = doctors.map(doc => {
    const isAvail = doc.availability === "Available" || doc.availability === "Available Today";
    const status  = isAvail
      ? badge("🟢 Available", "#065f46", "#d1fae5")
      : badge("🟡 Limited",   "#9a3412", "#fed7aa");
    return `<tr>
      <td><strong>${escapeHtml(doc.doctor_name)}</strong></td>
      <td>${escapeHtml(doc.specialization)}</td>
      <td>${escapeHtml(doc.availability)}</td>
      <td>${status}</td>
    </tr>`;
  });

  rows.push(summaryRow([
    "📊 Summary",
    `Total: <strong>${doctors.length}</strong> doctors`,
    `🟢 Available: <strong>${availableCount}</strong>`,
    `🟡 Limited: <strong>${doctors.length - availableCount}</strong>`
  ]));

  container.innerHTML = buildTable(
    ["👨‍⚕️ Doctor Name", "🔬 Specialization", "⏰ Schedule", "📌 Status"],
    rows
  );
}

// ---- PATIENTS ----

async function loadPatients() {
  const container = $("patientsTable");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;">🔄 Loading patient records…</div>`;

  const data = await fetchFromBackend("/patients");

  if (!data || !data.patients || data.patients.length === 0) {
    container.innerHTML = emptyBox(
      "📋 No patient records found",
      "Patient history will appear here after triage assessments are completed."
    );
    return;
  }

  const patients = [...data.patients].sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const priorityBadge = p => {
    if (p === "HIGH"   || p === "EMERGENCY" || p === "CRITICAL")
      return badge("🔴 " + p,  "#991b1b", "#fee2e2");
    if (p === "MEDIUM")
      return badge("🟡 MEDIUM", "#854d0e", "#fef9c3");
    return badge("🟢 LOW",    "#065f46", "#d1fae5");
  };

  const highCount   = patients.filter(p => ["HIGH","EMERGENCY","CRITICAL"].includes(p.severity)).length;
  const mediumCount = patients.filter(p => p.severity === "MEDIUM").length;
  const lowCount    = patients.filter(p => !["HIGH","EMERGENCY","CRITICAL","MEDIUM"].includes(p.severity)).length;

  const rows = patients.map(pat => {
    const score = pat.confidence_score;
    const bar   = score
      ? `<div style="background:#e2e8f0;border-radius:10px;height:8px;width:100px;display:inline-block;vertical-align:middle;margin-right:6px;">
           <div style="background:#0f766e;border-radius:10px;height:8px;width:${score}%;"></div>
         </div>${score}%`
      : "—";

    const dateStr = pat.created_at
      ? new Date(pat.created_at).toLocaleString()
      : "—";

    return `<tr>
      <td><strong>${escapeHtml(pat.patient_name)}</strong></td>
      <td>${escapeHtml(pat.predicted_disease || "—")}</td>
      <td>${priorityBadge(pat.severity || pat.priority)}</td>
      <td>${escapeHtml(dateStr)}</td>
      <td>${bar}</td>
    </tr>`;
  });

  rows.push(summaryRow([
    "📊 Summary",
    `Total: <strong>${patients.length}</strong> records`,
    `🔴 High: <strong>${highCount}</strong>`,
    `📅 Latest records shown first`,
    `🟢 Low: <strong>${lowCount}</strong>`
  ]));

  container.innerHTML = buildTable(
    ["👤 Patient Name", "🩺 Diagnosis", "⚡ Priority", "📅 Date", "📊 Confidence"],
    rows
  );
}

// ---- TOKENS ----

async function loadTokens() {
  const container = $("tokensTable");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;">🔄 Loading token queue…</div>`;

  const data = await fetchFromBackend("/tokens");

  if (!data || !data.tokens || data.tokens.length === 0) {
    container.innerHTML = emptyBox(
      "🎫 No active tokens in queue",
      "Tokens will appear here after triage assessments are completed."
    );
    return;
  }

  // Sort by token number ascending
  const tokens = [...data.tokens].sort((a, b) => {
    const na = parseInt(a.token_number) || 0;
    const nb = parseInt(b.token_number) || 0;
    return na - nb;
  });

  const priorityBadge = p => {
    if (p === "HIGH" || p === "EMERGENCY" || p === "CRITICAL")
      return badge("🔴 " + p,  "#991b1b", "#fee2e2");
    if (p === "MEDIUM") return badge("🟡 MEDIUM", "#854d0e", "#fef9c3");
    return badge("🟢 LOW",   "#065f46", "#d1fae5");
  };

  const statusBadge = s => {
    const st = String(s || "").toLowerCase();
    if (st.includes("consultation"))  return badge(s, "#065f46", "#d1fae5");
    if (st.includes("next"))          return badge(s, "#065f46", "#d1fae5");
    if (st.includes("queue"))         return badge(s, "#1e40af", "#dbeafe");
    if (st.includes("wait"))          return badge(s, "#9a3412", "#fed7aa");
    return badge(s || "Waiting",      "#475569", "#e2e8f0");
  };

  // Derive wait time from token order if backend doesn't supply it
  const calcWait = (idx, priority) => {
    const base = priority === "HIGH" ? 5 : priority === "MEDIUM" ? 15 : 20;
    return `~${base + idx * 10} min`;
  };

  const highCount   = tokens.filter(t => ["HIGH","EMERGENCY","CRITICAL"].includes(t.priority)).length;
  const mediumCount = tokens.filter(t => t.priority === "MEDIUM").length;
  const lowCount    = tokens.filter(t => !["HIGH","EMERGENCY","CRITICAL","MEDIUM"].includes(t.priority)).length;
  const inQueue     = tokens.filter(t => {
    const st = String(t.status || "").toLowerCase();
    return st.includes("queue") || st.includes("wait");
  }).length;

  const rows = tokens.map((tok, idx) => {
    const status   = tok.status      || tok.queue_status || tok.token_status || tok.consultation_status || "Waiting";
    const waitTime = tok.wait_time   || tok.estimated_wait_time || calcWait(idx, tok.priority);
    return `<tr>
      <td><strong>${escapeHtml(String(tok.token_number))}</strong></td>
      <td>${escapeHtml(tok.patient_name)}</td>
      <td>${escapeHtml(tok.doctor_name || "—")}</td>
      <td>${priorityBadge(tok.priority)}</td>
      <td>${statusBadge(status)}</td>
      <td>${escapeHtml(String(waitTime))}</td>
    </tr>`;
  });

  rows.push(summaryRow([
    "📊 Summary",
    `Total: <strong>${tokens.length}</strong> patients`,
    `—`,
    `🔴 High: <strong>${highCount}</strong> | 🟡 Med: <strong>${mediumCount}</strong> | 🟢 Low: <strong>${lowCount}</strong>`,
    `In Queue: <strong>${inQueue}</strong>`,
    ""
  ]));

  container.innerHTML = buildTable(
    ["🎫 Token No.", "👤 Patient", "👨‍⚕️ Doctor", "⚡ Priority", "📌 Status", "⏱️ Est. Wait"],
    rows
  );
}