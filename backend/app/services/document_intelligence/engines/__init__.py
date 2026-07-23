"""
engines/__init__.py
===================
Public surface of the engines sub-package.

Importing from here keeps downstream code clean::

    from app.services.document_intelligence.engines import (
        BaseExtractionEngine,
        GeminiExtractionEngine,
    )
"""

from app.services.document_intelligence.engines.base import BaseExtractionEngine
from .gemini_engine import GeminiExtractionEngine

__all__ = [
    "BaseExtractionEngine",
    "GeminiExtractionEngine",
]
