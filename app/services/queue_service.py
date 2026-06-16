import sqlite3


def get_queue_position(conn: sqlite3.Connection) -> int:
    """
    Count waiting tokens on the caller's connection.
    Does NOT open a new connection.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM tokens WHERE status = 'Waiting'"
    )

    return cursor.fetchone()[0]