"""
Doctors route.
GET /doctors — returns doctors from SQLite database.
"""

from fastapi import APIRouter
import sqlite3

router = APIRouter(tags=["Doctors"])


@router.get("/doctors", summary="List doctors")
def list_doctors():

    conn = sqlite3.connect("database/patients.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, doctor_name, specialization, availability
        FROM doctors
    """)

    doctors = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "count": len(doctors),
        "doctors": doctors
    }