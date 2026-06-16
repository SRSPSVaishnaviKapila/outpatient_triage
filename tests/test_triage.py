"""
Tests for triage endpoint and triage service logic.
Run: pytest tests/test_triage.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.triage_service import run_triage
from app.utils.symptom_normalizer import normalize_symptom, normalize_symptoms

client = TestClient(app)

VALID_PAYLOAD = {"patient_name": "Test Patient","age": 45, "gender": "Male", "symptoms": ["fever", "cough"]}


# ── /triage endpoint tests ────────────────────────────────────────────────────

class TestTriageEndpoint:

    def test_valid_request_returns_200(self):
        response = client.post("/triage", json=VALID_PAYLOAD)
        assert response.status_code == 200

    def test_valid_response_has_required_fields(self):
        response = client.post("/triage", json=VALID_PAYLOAD)
        body = response.json()
        assert "priority" in body
        assert "recommendation" in body
        assert "guidance" in body
        assert "matched_symptoms" in body

    def test_priority_is_valid_value(self):
        response = client.post("/triage", json=VALID_PAYLOAD)
        assert response.json()["priority"] in {"LOW", "MEDIUM", "HIGH", "EMERGENCY"}

    def test_fever_cough_returns_medium(self):
        """Case 3: fever + cough must never be EMERGENCY."""
        response = client.post("/triage", json=VALID_PAYLOAD)
        assert response.json()["priority"] == "MEDIUM"

    def test_emergency_symptom_returns_emergency_priority(self):
        payload = {"patient_name": "Test Patient","age": 60, "gender": "Male", "symptoms": ["chest pain"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_unconsciousness_returns_emergency(self):
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Female", "symptoms": ["unconsciousness"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_shortness_of_breath_returns_emergency(self):
        payload = {"patient_name": "Test Patient","age": 50, "gender": "Male", "symptoms": ["shortness of breath"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_mild_symptom_returns_low_or_medium(self):
        payload = {"patient_name": "Test Patient","age": 25, "gender": "Female", "symptoms": ["headache"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] in {"LOW", "MEDIUM"}

    # ── 7 required scenario tests ─────────────────────────────────────────────

    def test_case1_fever_alone_is_medium(self):
        """Case 1: fever alone -> MEDIUM."""
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Male", "symptoms": ["fever"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "MEDIUM"

    def test_case2_cough_alone_is_medium(self):
        """Case 2: cough alone -> MEDIUM."""
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Male", "symptoms": ["cough"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "MEDIUM"

    def test_case3_fever_cough_is_medium(self):
        """Case 3: fever + cough -> MEDIUM (not EMERGENCY)."""
        payload = {"patient_name": "Test Patient","age": 45, "gender": "Male", "symptoms": ["fever", "cough"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "MEDIUM"

    def test_case4_chest_pain_is_emergency(self):
        """Case 4: chest pain -> EMERGENCY."""
        payload = {"patient_name": "Test Patient","age": 60, "gender": "Male", "symptoms": ["chest pain"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_case5_unconsciousness_is_emergency(self):
        """Case 5: unconsciousness -> EMERGENCY."""
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Female", "symptoms": ["unconsciousness"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_case6_shortness_of_breath_is_emergency(self):
        """Case 6: shortness of breath -> EMERGENCY."""
        payload = {"patient_name": "Test Patient","age": 50, "gender": "Male", "symptoms": ["shortness of breath"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_case7_fever_with_breathing_difficulty_is_emergency(self):
        """Case 7: fever + breathing difficulty -> EMERGENCY (emergency symptom present)."""
        payload = {"patient_name": "Test Patient","age": 40, "gender": "Female", "symptoms": ["fever", "breathing difficulty"]}
        response = client.post("/triage", json=payload)
        assert response.json()["priority"] == "EMERGENCY"

    def test_empty_symptoms_returns_422(self):
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Male", "symptoms": []}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_whitespace_only_symptoms_returns_422(self):
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Male", "symptoms": ["   ", ""]}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_invalid_gender_returns_422(self):
        payload = {"patient_name": "Test Patient","age": 30, "gender": "Robot", "symptoms": ["fever"]}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_negative_age_returns_422(self):
        payload = {"patient_name": "Test Patient","age": -1, "gender": "Male", "symptoms": ["fever"]}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_age_over_120_returns_422(self):
        payload = {"patient_name": "Test Patient","age": 150, "gender": "Male", "symptoms": ["fever"]}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_missing_age_returns_422(self):
        payload = {"patient_name": "Test Patient","gender": "Male", "symptoms": ["fever"]}
        response = client.post("/triage", json=payload)
        assert response.status_code == 422

    def test_guidance_is_string(self):
        response = client.post("/triage", json=VALID_PAYLOAD)
        assert isinstance(response.json()["guidance"], str)
        assert len(response.json()["guidance"]) > 0

    def test_matched_symptoms_is_list(self):
        response = client.post("/triage", json=VALID_PAYLOAD)
        assert isinstance(response.json()["matched_symptoms"], list)


# ── Triage service unit tests ─────────────────────────────────────────────────

class TestTriageService:

    def test_emergency_symptom_direct(self):
        result = run_triage(["chest pain"])
        assert result["priority"] == "EMERGENCY"

    def test_fever_cough_direct_is_medium(self):
        result = run_triage(["fever", "cough"])
        assert result["priority"] == "MEDIUM"

    def test_fever_alone_direct_is_medium(self):
        result = run_triage(["fever"])
        assert result["priority"] == "MEDIUM"

    def test_breathing_difficulty_direct_is_emergency(self):
        result = run_triage(["breathing difficulty"])
        assert result["priority"] == "EMERGENCY"

    def test_sore_throat_is_low(self):
        result = run_triage(["sore throat"])
        assert result["priority"] == "LOW"

    def test_returns_dict_with_required_keys(self):
        result = run_triage(["fever"])
        assert {"priority", "recommendation", "matched_symptoms"} <= result.keys()

    def test_matched_symptoms_not_empty(self):
        result = run_triage(["fever", "cough"])
        assert len(result["matched_symptoms"]) > 0

    def test_recommendation_is_non_empty_string(self):
        result = run_triage(["fever"])
        assert isinstance(result["recommendation"], str)
        assert len(result["recommendation"]) > 0

    def test_emergency_recommendation_text(self):
        result = run_triage(["chest pain"])
        assert result["recommendation"] == "Immediate medical attention required. Inform doctor immediately."

    def test_medium_recommendation_text(self):
        result = run_triage(["fever"])
        assert result["recommendation"] == "Visit doctor within 24 hours."

    def test_low_recommendation_text(self):
        result = run_triage(["sore throat"])
        assert result["recommendation"] == "Home care and observation recommended."


# ── Symptom normalizer unit tests ─────────────────────────────────────────────

class TestSymptomNormalizer:

    def test_normalize_exact_match(self):
        # 'Fever' alias should map to 'fever' canonical
        result = normalize_symptom("Fever")
        assert result == "fever"

    def test_normalize_case_insensitive(self):
        result = normalize_symptom("FEVER")
        assert result == "fever"

    def test_normalize_unknown_returns_cleaned_input(self):
        result = normalize_symptom("  unknown_xyz  ")
        assert result == "unknown_xyz"

    def test_normalize_list(self):
        results = normalize_symptoms(["Fever", "Cough"])
        assert all(isinstance(r, str) for r in results)
        assert len(results) == 2
