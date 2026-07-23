"""Vercel Serverless Function entrypoint for FastAPI backend."""
import sys
from pathlib import Path

# Resolve absolute path to the backend directory
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402

# Export the FastAPI WSGI/ASGI application for Vercel
__all__ = ["app"]
