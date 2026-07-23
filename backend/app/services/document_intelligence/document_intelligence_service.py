"""
document_intelligence_service.py
=================================
Orchestrator for the Document Intelligence pipeline.

This is the single entry-point that callers (API endpoints, CLI scripts,
tests) interact with.  It wires together:

    TemplateLoader → PromptBuilder → ExtractionEngine → ResponseParser

and returns a fully validated ``ExtractionResponse``.

Architecture position
---------------------
::

    OCR Service (Phase 1 — untouched)
          ↓  raw_ocr_text
    DocumentIntelligenceService   ← you are here
      ├── TemplateLoader
      ├── PromptBuilder
      ├── ExtractionEngine (OpenAI / Gemini / Claude / ...)
      └── ResponseParser
          ↓  ExtractionResponse
    Frontend Verification  (Phase 3)
          ↓
    Database               (Phase 4)

Provider-agnostic design
------------------------
The engine is injected at construction time.  To switch providers::

    # OpenAI (default)
    svc = DocumentIntelligenceService()

    # Future: Gemini
    # from app.services.document_intelligence.engines.gemini_engine import GeminiEngine
    # svc = DocumentIntelligenceService(engine=GeminiEngine())

Usage
-----
::

    import asyncio
    from app.services.document_intelligence import DocumentIntelligenceService
    from app.services.document_intelligence.models import ExtractionRequest

    svc = DocumentIntelligenceService()

    request = ExtractionRequest(
        document_type="aadhaar",
        raw_ocr_text="...",         # text from OCR service
        image_url="https://...",    # optional Cloudinary URL
    )

    response = asyncio.run(svc.extract(request))
    print(response.model_dump_json(indent=2))
"""

from __future__ import annotations

import logging
from typing import Optional

from app.services.document_intelligence.engines.base import BaseExtractionEngine
from app.services.document_intelligence.engines.gemini_engine import GeminiExtractionEngine
from app.services.document_intelligence.exceptions import DocumentIntelligenceError
from app.services.document_intelligence.models import (
    DocumentTemplate,
    ExtractionRequest,
    ExtractionResponse,
)
from app.services.document_intelligence.prompt_builder import PromptBuilder
from app.services.document_intelligence.response_parser import ResponseParser
from app.services.document_intelligence.template_loader import TemplateLoader

logger = logging.getLogger(__name__)


class DocumentIntelligenceService:
    """
    Orchestrates the full document field-extraction pipeline.

    Parameters
    ----------
    engine : BaseExtractionEngine, optional
        LLM extraction engine to use.  Defaults to ``GeminiExtractionEngine``
        configured from environment variables.  Inject a different engine
        (or a mock) for testing or to switch providers.
    template_loader : TemplateLoader, optional
        Template loader instance.  Defaults to a standard ``TemplateLoader``
        pointed at ``app/templates/``.  Override in tests to use a custom
        templates directory.
    prompt_builder : PromptBuilder, optional
        Prompt assembly strategy.  Defaults to the standard ``PromptBuilder``.
        Subclass and inject to change prompting behaviour.
    response_parser : ResponseParser, optional
        Response normalisation strategy.  Defaults to the standard
        ``ResponseParser``.
    """

    def __init__(
        self,
        engine: Optional[BaseExtractionEngine] = None,
        template_loader: Optional[TemplateLoader] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        response_parser: Optional[ResponseParser] = None,
    ) -> None:
        self._engine: BaseExtractionEngine = engine or GeminiExtractionEngine()
        self._template_loader: TemplateLoader = template_loader or TemplateLoader()
        self._prompt_builder: PromptBuilder = prompt_builder or PromptBuilder()
        self._response_parser: ResponseParser = response_parser or ResponseParser()

        logger.info(
            "DocumentIntelligenceService initialised. engine=%s",
            self._engine.provider_name,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """
        Extract structured fields from raw OCR text.

        This is the sole public method.  The full pipeline is:

        1. Resolve the document template (from disk or the request override).
        2. Build the LLM prompt.
        3. Call the extraction engine.
        4. Parse and validate the LLM response.
        5. Return a structured ``ExtractionResponse``.

        Parameters
        ----------
        request : ExtractionRequest
            Input containing ``document_type``, ``raw_ocr_text``, and
            optional ``image_url`` / ``template`` override.

        Returns
        -------
        ExtractionResponse
            Validated structured output with per-field confidence scores and
            a warnings list.

        Raises
        ------
        TemplateNotFoundError
            If no template exists for ``request.document_type`` and no
            inline template was provided.
        TemplateValidationError
            If the template file or inline dict is malformed.
        ExtractionEngineError
            If the LLM provider returns an error.
        ResponseParseError
            If the LLM response cannot be parsed into the expected shape.
        DocumentIntelligenceError
            Base class — catch this to handle any service error generically.
        """
        logger.info(
            "DocumentIntelligenceService.extract() called. "
            "document_type='%s' ocr_text_length=%d",
            request.document_type,
            len(request.raw_ocr_text),
        )

        # ── Step 1: Resolve template ───────────────────────────────────────
        template: DocumentTemplate = self._resolve_template(request)

        # ── Step 2: Build prompt ───────────────────────────────────────────
        prompt: str = self._prompt_builder.build(request, template)

        # ── Step 3: Call LLM ───────────────────────────────────────────────
        logger.debug("Sending prompt to engine '%s'.", self._engine.provider_name)
        raw_response: str = await self._engine.extract(prompt)

        # ── Step 4: Parse response ─────────────────────────────────────────
        response: ExtractionResponse = self._response_parser.parse(raw_response, template)

        logger.info(
            "Extraction complete. document_type='%s' overall_confidence=%.2f warnings=%d",
            response.document_type,
            response.overall_confidence,
            len(response.warnings),
        )
        return response

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    def list_supported_document_types(self) -> list[str]:
        """
        Return a sorted list of document types for which a template is available.

        Useful for building API documentation or validation error messages.
        """
        return self._template_loader.list_available()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _resolve_template(self, request: ExtractionRequest) -> DocumentTemplate:
        """
        Return the resolved ``DocumentTemplate`` for the request.

        If the caller provided an inline ``template`` dict, validate and use
        it directly.  Otherwise, delegate to ``TemplateLoader``.
        """
        if request.template is not None:
            logger.debug(
                "Using inline template override for document_type='%s'.",
                request.document_type,
            )
            return DocumentTemplate.model_validate(request.template)

        return self._template_loader.load(request.document_type)
