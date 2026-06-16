"""
Health check route.
GET / — returns service status.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/", summary="Health check")
def health_check() -> dict:
    return {"status": "healthy"}
