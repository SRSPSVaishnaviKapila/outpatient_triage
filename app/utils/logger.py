"""
Logging utility.
- app.log  : all INFO and above messages
- error.log: ERROR and above messages only
Logs are stored under logs/app_logs/ relative to project root.
"""

import logging
import os
from pathlib import Path

# Resolve logs directory relative to this file (backend/utils/ -> project root)
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_LOG_DIR = _PROJECT_ROOT / "logs" / "app_logs"
_LOG_DIR.mkdir(parents=True, exist_ok=True)

_APP_LOG = str(_LOG_DIR / "app.log")
_ERR_LOG = str(_LOG_DIR / "error.log")

_FMT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FMT = "%Y-%m-%d %H:%M:%S"


def _build_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:          # avoid duplicate handlers on re-import
        return logger

    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(_FMT, datefmt=_DATE_FMT)

    # File handler — all messages
    fh = logging.FileHandler(_APP_LOG, encoding="utf-8")
    fh.setLevel(logging.INFO)
    fh.setFormatter(formatter)

    # File handler — errors only
    eh = logging.FileHandler(_ERR_LOG, encoding="utf-8")
    eh.setLevel(logging.ERROR)
    eh.setFormatter(formatter)

    # Console handler — INFO and above (useful during development)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)

    logger.addHandler(fh)
    logger.addHandler(eh)
    logger.addHandler(ch)
    return logger


def get_logger(name: str = "outpatient") -> logging.Logger:
    """Return a named logger wired to app.log and error.log."""
    return _build_logger(name)
