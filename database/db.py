"""
Database abstraction layer.

Phase 1: SQLite via a shared connection context manager.
         get_connection() is the single entry point — every service
         that needs DB access accepts a sqlite3.Connection parameter
         instead of opening its own. This eliminates "database is locked"
         errors that occur when multiple sqlite3.connect() calls are made
         to the same file within the same request.

Phase 2: replace get_connection() internals with SQLAlchemy + asyncpg
         for PostgreSQL. Service signatures stay identical.

Usage:
    from database.db import get_connection

    with get_connection() as conn:
        result_a = service_a(conn, ...)
        result_b = service_b(conn, ...)
        # conn.commit() is called automatically on clean exit
        # conn.rollback() is called automatically on exception
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from app.utils.logger import get_logger

logger = get_logger("database")

_DB_PATH = Path(__file__).resolve().parent / "patients.db"


@contextmanager
def get_connection():
    """
    Yield a single sqlite3.Connection for the duration of a request.
    Commits on clean exit, rolls back on any exception, always closes.
    """
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    # Enforce foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
