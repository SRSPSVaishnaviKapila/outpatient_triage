import sqlite3

conn = sqlite3.connect("patients.db")
cursor = conn.cursor()

inventory = [
    ("Paracetamol", 100),
    ("Ibuprofen", 75),
    ("Cough Syrup", 50),
]

cursor.executemany(
    """
    INSERT INTO inventory
    (medicine_name, quantity)
    VALUES (?, ?)
    """,
    inventory,
)

conn.commit()
conn.close()

print("Inventory inserted successfully!")