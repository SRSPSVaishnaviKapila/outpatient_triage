import sqlite3


def generate_token(conn: sqlite3.Connection, patient_id: int, priority: str) -> str:
    """
    Insert a token row and return the generated token number.
    Accepts the caller's connection — does NOT open a new one.
    """
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tokens")
    count = cursor.fetchone()[0] + 1
    token_number = f"PHC-{count:03d}"

    cursor.execute(
        """
        INSERT INTO tokens (token_number, patient_id, priority)
        VALUES (?, ?, ?)
        """,
        (token_number, patient_id, priority),
    )

    return token_number