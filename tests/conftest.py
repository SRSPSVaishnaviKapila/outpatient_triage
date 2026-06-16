"""
conftest.py — pytest configuration.
Inserts the project root into sys.path so that `app` is importable
as a top-level package and `database.db` is also directly reachable.
"""

import sys
from pathlib import Path

# Project root: one level above tests/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
