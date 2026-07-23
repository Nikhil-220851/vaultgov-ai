"""
document_intelligence/__init__.py
===================================
Public surface of the Document Intelligence Service package.

Callers only need to import from here::

    from app.services.document_intelligence import (
        DocumentIntelligenceService,
        ExtractionRequest,
        ExtractionResponse,
        FieldResult,
        DocumentTemplate,
    )

All exceptions are also re-exported for convenient catching::

    from app.services.document_intelligence import (
        DocumentIntelligenceError,
        TemplateNotFoundError,
        ExtractionEngineError,
        ResponseParseError,
    )
"""

from app.services.document_intelligence.document_intelligence_service import (
    DocumentIntelligenceService,
)
from app.services.document_intelligence.exceptions import (
    DocumentIntelligenceError,
    ExtractionEngineError,
    ResponseParseError,
    TemplateNotFoundError,
    TemplateValidationError,
)
from app.services.document_intelligence.models import (
    DocumentTemplate,
    ExtractionRequest,
    ExtractionResponse,
    FieldResult,
)

__all__ = [
    # Service
    "DocumentIntelligenceService",
    # Models
    "ExtractionRequest",
    "ExtractionResponse",
    "FieldResult",
    "DocumentTemplate",
    # Exceptions
    "DocumentIntelligenceError",
    "TemplateNotFoundError",
    "TemplateValidationError",
    "ExtractionEngineError",
    "ResponseParseError",
]
