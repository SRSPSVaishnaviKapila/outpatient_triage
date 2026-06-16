"""
Triage service.
Loads master_triage_dataset_400_rows.xlsx once at startup and scores
incoming symptoms to assign a priority level and recommendation.

Scoring is two-phase:

  Phase 1 — Symptom-first emergency gate (symptom list only, dataset ignored):
    ANY of the following symptoms -> EMERGENCY immediately:
      chest pain, unconsciousness, shortness of breath, breathing difficulty,
      breathing issue, low oxygen, seizure, stroke, heart attack, severe bleeding

  Phase 2 — Dataset-assisted MEDIUM / LOW scoring (only reached if not EMERGENCY):
    Dataset rows contribute MEDIUM or LOW only — never EMERGENCY.
    MEDIUM symptoms: fever, cough, headache, dizziness, vomiting,
                     abdominal pain, nausea, fatigue, body pain, back pain,
                     loss of appetite, palpitations, diarrhea, weight loss
    Everything else: LOW

This design prevents common disease rows that incidentally list fever+cough
alongside emergency diseases from false-escalating triage priority.
"""

from pathlib import Path
import pandas as pd
from app.utils.logger import get_logger
from app.utils.symptom_normalizer import normalize_symptoms
from app.ml.predict import predict_disease

logger = get_logger("triage_service")

_DATASET_DIR = Path(__file__).resolve().parents[2] / "datasets" / "triage"
_MASTER_FILE = _DATASET_DIR / "curated_triage_dataset_50_diseases.xlsx"

# Priority constants
PRIORITY_EMERGENCY = "EMERGENCY"
PRIORITY_HIGH = "HIGH"
PRIORITY_MEDIUM = "MEDIUM"
PRIORITY_LOW = "LOW"

_RECOMMENDATIONS = {
    PRIORITY_EMERGENCY: "Immediate medical attention required. Inform doctor immediately.",
    PRIORITY_HIGH: "Visit the doctor urgently within 2–4 hours.",
    PRIORITY_MEDIUM: "Visit doctor within 24 hours.",
    PRIORITY_LOW: "Home care and observation recommended.",
}

# Phase 1: symptoms that always trigger EMERGENCY regardless of dataset
_EMERGENCY_SYMPTOMS = {
    "chest pain",
    "unconsciousness",
    "unconscious",
    "shortness of breath",
    "breathing difficulty",
    "breathing issue",
    "low oxygen",
    "seizure",
    "seizures",
    "stroke",
    "heart attack",
    "severe bleeding",
}

# Phase 2: symptoms that score MEDIUM when no emergency symptom is present
_MEDIUM_SYMPTOMS = {
    "fever",
    "cough",
    "headache",
    "dizziness",
    "vomiting",
    "abdominal pain",
    "stomach pain",
    "nausea",
    "fatigue",
    "body pain",
    "back pain",
    "loss of appetite",
    "palpitations",
    "diarrhea",
    "weight loss",
    "high temperature",
}

SPECIALIZATION_MAP = {
    "common cold": "General Medicine",
    "flu": "General Medicine",
    "ear infection": "General Medicine",
    "food poisoning": "General Medicine",
    "hypertension": "Cardiology",
    "heart attack": "Cardiology",
    "asthma": "Pulmonology",
    "pneumonia": "Pulmonology",
    "bronchitis": "Pulmonology",
    "migraine": "Neurology",
    "stroke": "Neurology",
    "meningitis": "Neurology",
    "diabetes": "Endocrinology",
    "gastritis": "Gastroenterology",
    "appendicitis": "General Surgery",
    "kidney stone": "Urology",
}
MEDICINE_MAP = {
    "flu": ["Paracetamol"],
    "common cold": ["Paracetamol", "Cough Syrup"],
    "ear infection": ["Antibiotic Drops"],
    "food poisoning": ["ORS"],

    "migraine": ["Pain Reliever"],
    "dengue": ["Paracetamol", "Hydration"],
    "kidney infection": ["Consult Doctor"],
    "diabetes": ["Consult Doctor"],
    "hypertension": ["Consult Doctor"],
    "bronchitis": ["Cough Syrup"],
    "sinusitis": ["Steam Inhalation"],
    "gastritis": ["Antacid"],
    "pneumonia": ["Consult Doctor"],
    "asthma": ["Inhaler"],
    "meningitis": ["Consult Doctor"],
    "appendicitis": ["Consult Doctor"],
    "kidney stone": ["Pain Reliever"],
}
SIGNATURE_SYMPTOMS = {
    "ear infection": ["ear pain"],
    "kidney infection": ["burning urination"],
    "migraine": ["vision problems", "headache"],
    "heart attack": ["chest pain"],
    "stroke": ["confusion"],
    "asthma": ["breathing difficulty"],
    "pneumonia": ["shortness of breath"],
    "dengue": ["rash"],
    "diabetes": ["frequent urination"],

    # ADD THESE
    "meningitis": ["neck stiffness"],
    "appendicitis": ["abdominal pain"],
    "kidney stone": ["burning urination"],
    "covid-19": ["cough"],
}
# Loaded dataset rows: list of dicts with keys disease, symptoms_set, severity, emergency_flag
_triage_rows: list[dict] = []


def _load_dataset() -> None:
    global _triage_rows
    if _triage_rows:
        return

    if not _MASTER_FILE.exists():
        logger.error("Master triage dataset not found: %s", _MASTER_FILE)
        return

    try:
        df = pd.read_excel(_MASTER_FILE, dtype=str)
        df.columns = [c.strip().lower() for c in df.columns]
        for _, row in df.iterrows():
            raw_symptoms = str(row.get("symptoms", ""))
            symptom_set = {s.strip().lower() for s in raw_symptoms.split(",") if s.strip()}
            _triage_rows.append({
                "disease": str(row.get("disease", "")).strip(),
                "symptoms_set": symptom_set,
                "severity": str(row.get("severity", "")).strip().lower(),
                "emergency_flag": str(row.get("emergency_flag", "no")).strip().lower(),
                "recommendation": str(row.get("recommendation", "")).strip(),
            })
        logger.info("Loaded %d triage dataset rows", len(_triage_rows))
    except Exception as exc:
        logger.error("Failed to load triage dataset: %s", exc)


_load_dataset()

def run_triage(symptoms: list[str]) -> dict:
    """
    Score symptoms and return priority, recommendation, and matched symptoms.

    Args:
        symptoms: raw symptom strings from the request

    Returns:
        dict with keys: priority, recommendation, matched_symptoms
    """
    normalized = normalize_symptoms(symptoms)
    symptom_set = set(normalized)

    logger.info("Running triage for symptoms: %s", symptom_set)

    # ── Phase 1: Emergency gate ───────────────────────────────────────────────
    # EMERGENCY is decided solely by the presence of known emergency symptoms.
    # Dataset rows play no role here — this prevents common diseases that
    # incidentally list fever/cough from triggering a false EMERGENCY.
    emergency_hits = symptom_set & _EMERGENCY_SYMPTOMS
    if emergency_hits:
        matched = sorted(emergency_hits)

        return {
            "priority": PRIORITY_EMERGENCY,
            "recommendation": _RECOMMENDATIONS[PRIORITY_EMERGENCY],
            "matched_symptoms": matched,

            "predicted_disease": "Emergency Condition",
            "confidence_score": 100,
            "recommended_medicines": ["Immediate Medical Attention"]
        }   

    # ── Phase 2: MEDIUM / LOW scoring ────────────────────────────────────────
    # Check patient symptoms against the MEDIUM symptom list first.
    # Dataset rows are used only to collect matched_symptoms for context;
    # they cannot escalate priority to EMERGENCY.
    medium_hits = symptom_set & _MEDIUM_SYMPTOMS
    ml_result = predict_disease(normalized)

    best_disease = ml_result["disease"]
    confidence = ml_result["confidence"]

    # Find best matching disease
    all_matched: set[str] = set()

    #best_disease = "Unknown"
    best_score = 0.0
    #confidence = 0.0

    for row in _triage_rows:

        overlap = symptom_set & row["symptoms_set"]

        # Require at least 2 matching symptoms
        total_symptoms = max(len(row["symptoms_set"]), 1)

        match_ratio = len(overlap) / total_symptoms

        if len(overlap) < 2:
            continue

        if match_ratio < 0.6:
            continue

        disease = row["disease"].strip()
        disease_key = disease.lower()

        # Signature symptom validation
        required = SIGNATURE_SYMPTOMS.get(disease_key)

        if required:
            if not any(symptom in symptom_set for symptom in required):
                continue

        all_matched |= overlap

        # Percentage match score
        score = len(overlap)
        print(
            f"Disease={disease} "
            f"Overlap={overlap} "
            f"Score={score}"
        )

       # if score > best_score:
       #     best_score = score
        #    best_disease = disease
         #   confidence = (
          #  len(overlap)
           # / max(len(row["symptoms_set"]), 1)
        #) * 100
    
    matched_symptoms = sorted(all_matched) if all_matched else sorted(symptom_set)

    if best_disease == "Unknown":
        recommended_medicines = ["Consult Doctor"]
    else:
        recommended_medicines = MEDICINE_MAP.get(
            best_disease.lower(),
            ["Consult Doctor"]
        )
    doctor_specialization = SPECIALIZATION_MAP.get(
    best_disease.lower(),
    "General Medicine"
    )

    if medium_hits:
        priority = PRIORITY_MEDIUM
    else:
        priority = PRIORITY_LOW

    logger.info("Triage result: priority=%s matched=%s", priority, matched_symptoms)
    return {
        "priority": priority,
        "recommendation": _RECOMMENDATIONS[priority],
        "matched_symptoms": matched_symptoms,
        "predicted_disease": best_disease,
        "confidence_score": round(confidence, 1),
        "recommended_medicines": recommended_medicines,
        "doctor_specialization": doctor_specialization,  # computed from SPECIALIZATION_MAP
    }
