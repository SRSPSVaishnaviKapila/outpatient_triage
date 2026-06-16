"""
Symptoms route.
GET /symptoms — returns all supported canonical symptom names.
"""

from fastapi import APIRouter
from app.utils.symptom_normalizer import get_all_canonical_symptoms

router = APIRouter(tags=["Symptoms"])


@router.get("/symptoms", summary="List supported symptoms")
def list_symptoms() -> dict:
    return {"symptoms": get_all_canonical_symptoms()}
