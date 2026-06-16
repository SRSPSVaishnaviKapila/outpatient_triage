"""
Pydantic models for triage request validation and response serialization.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List
from typing import Optional


class TriageRequest(BaseModel):
    patient_name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=120, description="Patient age in years")
    gender: str = Field(..., description="Patient gender (Male / Female / Other)")
    symptoms: List[str] = Field(..., min_length=1, description="List of reported symptoms")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        allowed = {"male", "female", "other"}
        if v.strip().lower() not in allowed:
            raise ValueError("gender must be Male, Female, or Other")
        return v.strip().title()

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, v: List[str]) -> List[str]:
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("symptoms list must contain at least one non-empty entry")
        return cleaned


class TriageResponse(BaseModel):
    priority: str
    recommendation: str
    guidance: str
    matched_symptoms: List[str]

    predicted_disease: str
    confidence_score: float

    token_number: str

    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None

    queue_position: Optional[int] = None
    estimated_wait_time: Optional[str] = None
    recommended_medicines: list[str]
    medicine_available: bool = False