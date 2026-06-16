"""
Inventory route.
GET /inventory — returns inventory from SQLite database.
"""

from fastapi import APIRouter
import sqlite3

router = APIRouter(tags=["Inventory"])


@router.get("/inventory", summary="Inventory status")
def get_inventory():

    conn = sqlite3.connect("database/patients.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, medicine_name, quantity
        FROM inventory
    """)

    items = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "count": len(items),
        "items": items
    }