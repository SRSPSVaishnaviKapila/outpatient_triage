import sqlite3
from fastapi import APIRouter

router = APIRouter(tags=["Patients"])


@router.get("/patients", summary="Patient history")
def get_patients():

    conn = sqlite3.connect("database/patients.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            patient_name,
            age,
            gender,
            symptoms,
            severity,
            recommendation,
            predicted_disease,
            confidence_score,
            created_at
        FROM patients
        ORDER BY id DESC
    """)

    patients = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "count": len(patients),
        "patients": patients
    }