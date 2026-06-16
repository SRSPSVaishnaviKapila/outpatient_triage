import sqlite3

conn = sqlite3.connect("patients.db")
cursor = conn.cursor()

doctors = [
    ("Dr. Ravi", "General Medicine", "Available"),
    ("Dr. Priya", "Pediatrics", "Available"),
    ("Dr. Arjun", "Cardiology", "Busy"),
]

cursor.executemany(
    """
    INSERT INTO doctors
    (doctor_name, specialization, availability)
    VALUES (?, ?, ?)
    """,
    doctors,
)

conn.commit()
conn.close()

print("Doctors inserted successfully!")