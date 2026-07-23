"""
response_parser.py
==================
Parses and normalises the raw JSON string returned by the LLM into a
validated ``ExtractionResponse``.

Responsibilities
----------------
1. Strip any accidental markdown fences (``` ... ```) the LLM may add.
2. JSON-decode the cleaned string.
3. Validate the shape with Pydantic.
4. Canonicalise field keys using the template's ``output_field_names`` map.
5. Inject warnings for required fields that ended up null.
6. Clamp/coerce confidence values into [0.0, 1.0].

All failure modes raise ``ResponseParseError`` with a clear message and the
raw LLM string attached for debugging.

Usage
-----
::

    parser = ResponseParser()
    response = parser.parse(raw_llm_json_string, template)
    # response: ExtractionResponse
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict

from pydantic import ValidationError

from app.services.document_intelligence.exceptions import ResponseParseError
from app.services.document_intelligence.models import (
    DocumentTemplate,
    ExtractionResponse,
    FieldResult,
)

logger = logging.getLogger(__name__)

# We don't strictly need this regex if we use brace extraction, but keeping it for safety.
_MD_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", re.DOTALL | re.IGNORECASE)


class ResponseParser:
    """
    Converts the raw LLM string output into a validated ``ExtractionResponse``.
    """

    def parse(
        self,
        raw_response: str,
        template: DocumentTemplate,
    ) -> ExtractionResponse:
        """
        Parse and validate the LLM response.

        Parameters
        ----------
        raw_response:
            The raw string returned by the extraction engine.  May contain
            leading/trailing whitespace or accidental markdown fences.
        template:
            The resolved document template used during extraction (needed for
            field canonicalisation and required-field warning injection).

        Returns
        -------
        ExtractionResponse
            Fully validated response ready for the caller.

        Raises
        ------
        ResponseParseError
            If the string cannot be decoded as JSON or does not satisfy the
            expected schema.
        """
        cleaned = self._strip_markdown(raw_response.strip())
        raw_dict = self._decode_json(cleaned, raw_response)
        response = self._build_response(raw_dict, template, raw_response)
        self._inject_required_field_warnings(response, template)

        logger.info(
            "Parsed extraction response for document_type='%s'. "
            "Fields=%d, Warnings=%d, OverallConfidence=%.2f",
            response.document_type,
            len(response.fields),
            len(response.warnings),
            response.overall_confidence,
        )
        return response

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _strip_markdown(self, text: str) -> str:
        """Remove markdown code fences if the LLM wrapped its JSON output."""
        match = _MD_FENCE_RE.match(text)
        if match:
            logger.debug("Stripped markdown fences from LLM response.")
            return match.group(1).strip()
        return text

    def _extract_first_json_object(self, text: str) -> str:
        """
        Extract the outermost JSON object by finding the first '{' and matching it
        to the corresponding last '}'. This avoids trailing/leading text issues.
        """
        start = text.find('{')
        if start == -1:
            return text  # Give up, let standard decode fail
            
        # We find the last '}' to handle trailing explanations
        end = text.rfind('}')
        if end == -1 or end < start:
            return text
            
        extracted = text[start:end+1]
        logger.debug("Extracted JSON object from surrounding text.")
        return extracted

    def _decode_json(self, text: str, raw_response: str) -> Dict[str, Any]:
        """Attempt to JSON-decode the cleaned text."""
        cleaned_text = self._extract_first_json_object(text)
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as exc:
            # Fallback: log the error, then we will raise ResponseParseError
            logger.error("JSONDecodeError after extraction. Extracted block: %r", cleaned_text[:100])
            raise ResponseParseError(
                detail=f"JSON decode error at position {exc.pos}: {exc.msg}",
                raw_response=raw_response,
            ) from exc

    def _build_response(
        self,
        raw_dict: Dict[str, Any],
        template: DocumentTemplate,
        raw_response: str,
    ) -> ExtractionResponse:
        """
        Construct an ``ExtractionResponse`` from the decoded dict.

        Handles two possible LLM output styles:
        1. Preferred: ``fields`` is a dict of ``{field_name: {value, confidence}}``
        2. Flat fallback: ``fields`` is a dict of ``{field_name: "<string value>"}``
           (some models ignore the nested schema; we coerce gracefully).
        """
        if not isinstance(raw_dict, dict):
            raise ResponseParseError(
                detail=f"Expected a JSON object at the top level, got {type(raw_dict).__name__}.",
                raw_response=raw_response,
            )

        # ── document_type ─────────────────────────────────────────────
        document_type = str(raw_dict.get("document_type", template.document_type))

        # ── warnings ──────────────────────────────────────────────────
        raw_warnings = raw_dict.get("warnings", [])
        warnings: list[str] = (
            [str(w) for w in raw_warnings]
            if isinstance(raw_warnings, list)
            else []
        )

        # ── fields ────────────────────────────────────────────────────
        raw_fields = raw_dict.get("fields", {})
        if not isinstance(raw_fields, dict):
            raise ResponseParseError(
                detail="'fields' must be a JSON object.",
                raw_response=raw_response,
            )

        # Build canonical output_field_names reverse map (output_key → canonical)
        # so we can accept both the output key and the raw template key.
        canonical_reverse: dict[str, str] = {
            v: k for k, v in template.output_field_names.items()
        }

        parsed_fields: Dict[str, FieldResult] = {}

        for raw_key, raw_value in raw_fields.items():
            # Determine the canonical output key
            output_key = template.output_field_names.get(raw_key, raw_key)

            # Normalise value/confidence
            if isinstance(raw_value, dict):
                field_value = raw_value.get("value")
                confidence_raw = raw_value.get("confidence", 0.0)
            else:
                # Flat value: treat as the field value with moderate confidence
                field_value = raw_value if raw_value not in (None, "", "null") else None
                confidence_raw = 0.6 if field_value is not None else 0.0
                warnings.append(
                    f"Field '{output_key}' returned as flat string instead of "
                    "{{value, confidence}} object; confidence defaulted to 0.6."
                )

            # Normalise value type
            if field_value in (None, "", "null", "NULL", "N/A", "n/a"):
                field_value = None
                confidence_raw = 0.0

            try:
                parsed_fields[output_key] = FieldResult(
                    value=str(field_value) if field_value is not None else None,
                    confidence=confidence_raw,
                )
            except ValidationError as exc:
                warnings.append(
                    f"Field '{output_key}' failed validation and was skipped: {exc}"
                )

        # Ensure every template field appears in the response (fill missing with null)
        for field in template.all_fields:
            output_key = template.output_field_names.get(field, field)
            if output_key not in parsed_fields:
                parsed_fields[output_key] = FieldResult(value=None, confidence=0.0)
                warnings.append(
                    f"Field '{output_key}' was not returned by the LLM and was defaulted to null."
                )

        try:
            return ExtractionResponse(
                document_type=document_type,
                fields=parsed_fields,
                warnings=warnings,
            )
        except ValidationError as exc:
            raise ResponseParseError(
                detail=f"ExtractionResponse validation failed: {exc}",
                raw_response=raw_response,
            ) from exc

    def _inject_required_field_warnings(
        self,
        response: ExtractionResponse,
        template: DocumentTemplate,
    ) -> None:
        """
        Add a warning for each required field that ended up with a null value.
        This runs after the response is built so it augments existing warnings.
        """
        for field in template.required_fields:
            output_key = template.output_field_names.get(field, field)
            result = response.fields.get(output_key)
            if result is None or result.value is None:
                warning = f"Required field '{output_key}' could not be extracted from the OCR text."
                if warning not in response.warnings:
                    response.warnings.append(warning)
