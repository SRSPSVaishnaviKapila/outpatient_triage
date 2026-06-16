import sqlite3


def check_medicine_availability(conn: sqlite3.Connection, medicine_name: str) -> int:
    """
    Query inventory table on the caller's connection.
    Does NOT open a new connection.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT quantity FROM inventory WHERE medicine_name = ?",
        (medicine_name,),
    )

    row = cursor.fetchone()
    return row["quantity"] if row else 0