"""
Symptom normalizer.
Loads symptom_aliases.xlsx once at startup and provides normalize_symptom()
which maps English aliases, Telugu text, and regional variations to a
canonical symptom name (e.g. 'fever').
"""

from pathlib import Path
import pandas as pd
from app.utils.logger import get_logger

logger = get_logger("normalizer")

_DATASET_DIR = Path(__file__).resolve().parents[2] / "datasets" / "triage"
_ALIAS_FILE = _DATASET_DIR / "symptom_aliases.xlsx"

# alias_map: { lowercase_alias -> canonical_symptom }
_alias_map: dict[str, str] = {}


def _load_aliases() -> None:
    """Load alias table from Excel into an in-memory dict."""
    global _alias_map
    if _alias_map:
        return  # already loaded

    if not _ALIAS_FILE.exists():
        logger.error("symptom_aliases.xlsx not found at %s", _ALIAS_FILE)
        return

    try:
        df = pd.read_excel(_ALIAS_FILE, dtype=str)
        # Expected columns: canonical_symptom, alias
        for _, row in df.iterrows():
            canonical = str(row.get("canonical_symptom", "")).strip().lower()
            alias = str(row.get("alias", "")).strip().lower()
            if canonical and alias:
                _alias_map[alias] = canonical
        logger.info("Loaded %d symptom aliases", len(_alias_map))
    except Exception as exc:
        logger.error("Failed to load symptom aliases: %s", exc)


# Load on module import
_load_aliases()


def normalize_symptom(symptom: str) -> str:
    """
    Convert any symptom string (English alias, Telugu, regional variation)
    to its canonical lowercase form.

    Returns the canonical name if a mapping exists, otherwise returns the
    cleaned lowercase input unchanged.
    """
    cleaned = symptom.strip().lower()
    return _alias_map.get(cleaned, cleaned)


def normalize_symptoms(symptoms: list[str]) -> list[str]:
    """Normalize a list of symptom strings."""
    return [normalize_symptom(s) for s in symptoms]


def get_all_canonical_symptoms() -> list[str]:
    """Return sorted list of all unique canonical symptom names."""
    return sorted(set(_alias_map.values()))
