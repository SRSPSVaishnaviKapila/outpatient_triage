import sqlite3


def find_available_doctor(conn: sqlite3.Connection, specialization: str):
    """
    Query doctors table on the caller's connection.
    Does NOT open a new connection.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT doctor_name, specialization
        FROM doctors
        WHERE specialization = ?
        AND availability = 'Available'
        LIMIT 1
        """,
        (specialization,),
    )

    doctor = cursor.fetchone()
    return dict(doctor) if doctor else None