import sqlite3
from fastapi import APIRouter

router = APIRouter(tags=["Tokens"])


@router.get("/tokens")
def get_tokens():
    conn = sqlite3.connect("database/patients.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute(
    """
    SELECT
        t.token_number,
        p.patient_name,
        p.doctor_name,
        t.priority,
        t.status
    FROM tokens t
    LEFT JOIN patients p
        ON t.patient_id = p.id
    ORDER BY t.id DESC
    """
    )
    rows = cursor.fetchall()

    conn.close()

    return {
        "count": len(rows),
        "tokens": [dict(row) for row in rows]
    }