"""
exceptions.py
=============
Custom exception hierarchy for the Document Intelligence Service.

All exceptions raised by this package inherit from ``DocumentIntelligenceError``
so callers can catch the entire family with a single ``except`` clause while
still being able to discriminate specific failure modes.
"""


class DocumentIntelligenceError(Exception):
    """Base exception for all Document Intelligence Service errors."""


class TemplateNotFoundError(DocumentIntelligenceError):
    """Raised when no template exists for the requested document type."""

    def __init__(self, document_type: str) -> None:
        self.document_type = document_type
        super().__init__(
            f"No extraction template found for document type: '{document_type}'. "
            "Ensure a corresponding JSON file exists in app/templates/."
        )


class TemplateValidationError(DocumentIntelligenceError):
    """Raised when a template JSON file fails schema validation."""

    def __init__(self, document_type: str, detail: str) -> None:
        self.document_type = document_type
        super().__init__(
            f"Template for '{document_type}' failed validation: {detail}"
        )


class ExtractionEngineError(DocumentIntelligenceError):
    """Raised when the underlying LLM provider returns an error or times out."""

    def __init__(self, provider: str, detail: str) -> None:
        self.provider = provider
        super().__init__(f"Extraction engine '{provider}' error: {detail}")


class ResponseParseError(DocumentIntelligenceError):
    """Raised when the LLM response cannot be parsed into the expected JSON shape."""

    def __init__(self, detail: str, raw_response: str = "") -> None:
        self.raw_response = raw_response
        super().__init__(
            f"Failed to parse LLM response into structured output: {detail}"
        )
