from pathlib import Path
import joblib

MODEL_PATH = Path(__file__).parent / "triage_model.pkl"

model = joblib.load(MODEL_PATH)

def predict_disease(symptoms: list[str]):
    """
    Predict disease and confidence score using trained ML model.
    """

    symptom_text = ",".join(symptoms)

    prediction = model.predict([symptom_text])[0]

    confidence = float(
        round(
        max(model.predict_proba([symptom_text])[0]) * 100,
        2
    )
)

    return {
        "disease": prediction,
        "confidence": confidence
    }