"""
File-based RAG loader.
Retrieves health guidance text from dataset/rag_documents/*.txt.
No vector database — plain keyword-to-file mapping.
Future LLM API integration: pass the retrieved text as context to the LLM.
"""

from pathlib import Path
from app.utils.logger import get_logger

logger = get_logger("rag_loader")

_RAG_DIR = Path(__file__).resolve().parents[2] / "datasets" / "rag_documents"

# Map canonical symptom names to their document filenames (without .txt)
_SYMPTOM_DOC_MAP: dict[str, str] = {
    "fever": "fever",
    "high temperature": "fever",
    "cough": "cough",
    "headache": "headache",
    "chest pain": "chest_pain",
    "dizziness": "dizziness",
    "vomiting": "vomiting",
    "nausea": "vomiting",
    "abdominal pain": "abdominal_pain",
    "stomach pain": "abdominal_pain",
    "breathing issue": "breathing_issue",
    "breathing difficulty": "breathing_issue",
    "shortness of breath": "shortness_of_breath",
    "unconsciousness": "unconsciousness",
    "unconscious": "unconsciousness",
}

# In-memory document cache
_doc_cache: dict[str, str] = {}


def _load_document(doc_name: str) -> str:
    """Load and cache a RAG document by filename stem."""
    if doc_name in _doc_cache:
        return _doc_cache[doc_name]

    doc_path = _RAG_DIR / f"{doc_name}.txt"
    if not doc_path.exists():
        logger.warning("RAG document not found: %s", doc_path)
        return ""

    try:
        content = doc_path.read_text(encoding="utf-8")
        _doc_cache[doc_name] = content
        logger.info("Loaded RAG document: %s", doc_name)
        return content
    except Exception as exc:
        logger.error("Failed to read RAG document %s: %s", doc_name, exc)
        return ""


def get_guidance(symptoms: list[str]) -> str:
    """
    Given a list of normalized symptom names, return combined RAG guidance
    from matching documents. Returns empty string if no documents match.
    """
    seen_docs: set[str] = set()
    sections: list[str] = []

    for symptom in symptoms:
        doc_name = _SYMPTOM_DOC_MAP.get(symptom.lower())
        if doc_name and doc_name not in seen_docs:
            content = _load_document(doc_name)
            if content:
                seen_docs.add(doc_name)
                sections.append(content.strip())

    return "\n\n---\n\n".join(sections)
