"""
Triage route.
POST /triage — accepts patient age, gender, symptoms and returns
priority, recommendation, RAG guidance, matched symptoms.
"""

from fastapi import APIRouter, HTTPException
from app.models.triage_models import TriageRequest, TriageResponse
from app.services.triage_service import run_triage
from app.services.rag_service import get_rag_guidance
from app.services.token_service import generate_token
from app.services.doctor_service import find_available_doctor
from app.services.queue_service import get_queue_position
from app.services.inventory_service import check_medicine_availability
from app.utils.logger import get_logger
from database.db import get_connection

router = APIRouter(tags=["Triage"])
logger = get_logger("route.triage")


@router.post("/triage", response_model=TriageResponse, summary="Symptom triage")
def triage_patient(request: TriageRequest) -> TriageResponse:
    """
    Accepts patient demographics and symptoms.
    Returns triage priority, recommendation,
    health guidance, and matched symptoms.
    """
    logger.info(
        "Triage request received | name=%s age=%d gender=%s symptoms=%s",
        request.patient_name, request.age, request.gender, request.symptoms,
    )

    result = run_triage(request.symptoms)
    guidance = get_rag_guidance(result["matched_symptoms"])

    # One connection, one transaction — all DB operations share it.
    # get_connection() commits on success, rolls back on any exception.
    try:
        with get_connection() as conn:
            # 1. Resolve specialization from triage result, then find matching doctor
            specialization = result.get("doctor_specialization", "General Medicine")
            doctor = find_available_doctor(conn, specialization)

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO patients
                    (patient_name, age, gender, symptoms,
                     severity, recommendation, predicted_disease, confidence_score, doctor_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    request.patient_name,
                    request.age,
                    request.gender,
                    ", ".join(request.symptoms),
                    result["priority"],
                    result["recommendation"],
                    result["predicted_disease"],
                    result["confidence_score"],
                    doctor["doctor_name"] if doctor else None,
                ),
            )
            patient_id = cursor.lastrowid

            # 2. Generate token — same connection, no second sqlite3.connect()
            token_number = generate_token(conn, patient_id, result["priority"])

            # 3. Read-only queries — same connection, no extra locks
            queue_position = get_queue_position(conn)
            quantity = check_medicine_availability(conn, "Paracetamol")

    except Exception as exc:
        logger.error("DB error during triage for %s: %s", request.patient_name, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save triage record")

    medicine_available = quantity > 0

    logger.info("Priority assigned: %s | token=%s", result["priority"], token_number)

    return TriageResponse(
        priority=result["priority"],
        recommendation=result["recommendation"],
        guidance=guidance,
        matched_symptoms=result["matched_symptoms"],
        predicted_disease=result["predicted_disease"],
        confidence_score=result["confidence_score"],
        token_number=token_number,
        doctor_name=doctor["doctor_name"] if doctor else None,
        doctor_specialization=doctor["specialization"] if doctor else None,
        queue_position=queue_position,
        estimated_wait_time=f"{queue_position * 5} minutes",
        recommended_medicines=result.get("recommended_medicines", ["Consult Doctor"]),
        medicine_available=medicine_available,
    )