"""Vercel serverless entrypoint.

Vercel's Python runtime looks for a WSGI callable named ``app`` in ``api/*.py``.
The Flask app factory lives one directory up, so add that to the import path.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402

app = create_app()
