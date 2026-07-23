"""
template_loader.py
==================
Loads and caches document extraction templates from disk.

Templates live in ``backend/app/templates/<document_type>.json``.
Each file is validated against the ``DocumentTemplate`` Pydantic model on
first load and then stored in an in-process LRU cache so repeated calls are
O(1) dictionary lookups.

Usage
-----
::

    loader = TemplateLoader()
    template = loader.load("aadhaar")       # returns DocumentTemplate
    template = loader.load("pan")
    loader.clear_cache()                     # optional, useful in tests

Errors
------
- ``TemplateNotFoundError``   — file does not exist for requested doc type.
- ``TemplateValidationError`` — file exists but JSON is invalid or schema check fails.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Dict, Optional

from pydantic import ValidationError

from app.services.document_intelligence.exceptions import (
    TemplateNotFoundError,
    TemplateValidationError,
)
from app.services.document_intelligence.models import DocumentTemplate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
# Compute the templates directory relative to this file:
#   <repo>/backend/app/services/document_intelligence/template_loader.py
#                               → ../../templates/
# This keeps the loader relocatable without env-var configuration.
_THIS_DIR = Path(__file__).parent
_DEFAULT_TEMPLATES_DIR = (_THIS_DIR / ".." / ".." / "templates").resolve()


class TemplateLoader:
    """
    Loads and caches ``DocumentTemplate`` objects from JSON files.

    Parameters
    ----------
    templates_dir:
        Directory containing ``<document_type>.json`` template files.
        Defaults to ``backend/app/templates/``.
    """

    def __init__(self, templates_dir: Optional[Path] = None) -> None:
        self._templates_dir: Path = templates_dir or _DEFAULT_TEMPLATES_DIR
        self._cache: Dict[str, DocumentTemplate] = {}

        logger.debug(
            "TemplateLoader initialised. Templates directory: %s",
            self._templates_dir,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self, document_type: str) -> DocumentTemplate:
        """
        Return the ``DocumentTemplate`` for *document_type*.

        Results are cached in memory after the first disk read.

        Parameters
        ----------
        document_type:
            Case-insensitive document type string (e.g. ``"aadhaar"``,
            ``"PAN"``, ``"Passport"``).

        Returns
        -------
        DocumentTemplate
            Validated template ready for use by ``PromptBuilder``.

        Raises
        ------
        TemplateNotFoundError
            If no JSON file exists for the given document type.
        TemplateValidationError
            If the JSON file exists but fails Pydantic validation.
        """
        key = document_type.strip().lower()

        if key in self._cache:
            logger.debug("TemplateLoader cache hit for '%s'.", key)
            return self._cache[key]

        template = self._load_from_disk(key)
        self._cache[key] = template
        logger.info("Template loaded and cached for document type '%s'.", key)
        return template

    def list_available(self) -> list[str]:
        """
        Return a sorted list of document type identifiers for which a template
        file exists in the templates directory.
        """
        if not self._templates_dir.is_dir():
            logger.warning(
                "Templates directory does not exist: %s", self._templates_dir
            )
            return []

        return sorted(
            p.stem
            for p in self._templates_dir.iterdir()
            if p.suffix == ".json" and p.is_file()
        )

    def clear_cache(self) -> None:
        """Evict all cached templates.  Useful in tests or after hot-reloading."""
        self._cache.clear()
        logger.debug("TemplateLoader cache cleared.")

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_from_disk(self, document_type: str) -> DocumentTemplate:
        """Read, parse, and validate a single template file."""
        template_path = self._templates_dir / f"{document_type}.json"

        if not template_path.exists():
            available = self.list_available()
            logger.error(
                "Template file not found: %s. Available types: %s",
                template_path,
                available,
            )
            raise TemplateNotFoundError(document_type)

        logger.debug("Reading template from disk: %s", template_path)

        try:
            raw_text = template_path.read_text(encoding="utf-8")
            raw_dict = json.loads(raw_text)
        except (OSError, json.JSONDecodeError) as exc:
            raise TemplateValidationError(
                document_type,
                f"Failed to read or parse JSON: {exc}",
            ) from exc

        try:
            template = DocumentTemplate.model_validate(raw_dict)
        except ValidationError as exc:
            raise TemplateValidationError(
                document_type,
                str(exc),
            ) from exc

        return template
