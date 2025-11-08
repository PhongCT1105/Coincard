"""Vercel serverless entrypoint for the FastAPI app."""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from src.main import app  # noqa: E402

__all__ = ["app"]
