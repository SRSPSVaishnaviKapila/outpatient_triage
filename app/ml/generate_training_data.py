from itertools import combinations
from pathlib import Path
import pandas as pd

# Dataset path
DATASET_FILE = (
    Path(__file__).resolve().parents[2]
    / "dataset"
    / "triage"
    / "curated_triage_dataset_50_diseases.xlsx"
)

# Output file
OUTPUT_FILE = (
    Path(__file__).resolve().parent
    / "ml_training_dataset.xlsx"
)

df = pd.read_excel(DATASET_FILE)

rows = []

for _, row in df.iterrows():

    disease = row["disease"]

    symptoms = [
        s.strip()
        for s in str(row["symptoms"]).split(",")
        if s.strip()
    ]

    severity = row["severity"]
    department = row["department"]
    emergency = row["emergency"]
    recommendation = row["recommendation"]

    # Generate all combinations
    for r in range(2, len(symptoms) + 1):

        for combo in combinations(symptoms, r):

            rows.append({
                "disease": disease,
                "symptoms": ",".join(combo),
                "severity": severity,
                "department": department,
                "emergency": emergency,
                "recommendation": recommendation
            })

augmented_df = pd.DataFrame(rows)

print(f"Generated {len(augmented_df)} rows")

augmented_df.to_excel(
    OUTPUT_FILE,
    index=False
)

print(f"Saved to: {OUTPUT_FILE}")