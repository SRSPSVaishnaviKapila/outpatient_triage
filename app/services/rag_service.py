"""
RAG service.
Retrieves health guidance from file-based RAG documents.
Designed so future LLM API integration only requires replacing
_build_response() — the retrieval layer stays unchanged.
"""

from app.utils.rag_loader import get_guidance
from app.utils.logger import get_logger

logger = get_logger("rag_service")

_FALLBACK = (
    "Please consult a qualified healthcare professional for accurate diagnosis "
    "and treatment. Do not self-medicate."
)


def get_rag_guidance(symptoms: list[str]) -> str:
    """
    Return health guidance text for the given normalized symptom list.
    Falls back to a generic advisory if no matching documents are found.

    Future LLM integration point:
        Pass the retrieved `raw_context` as a system prompt to the LLM API
        and return the LLM-generated response instead of raw_context.
    """
    raw_context = get_guidance(symptoms)

    if not raw_context:
        logger.info("No RAG document matched for symptoms: %s", symptoms)
        return _FALLBACK

    logger.info("RAG guidance retrieved for symptoms: %s", symptoms)
    return raw_context
