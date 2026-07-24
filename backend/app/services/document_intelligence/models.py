"""
models.py
=========
Pydantic I/O models for the Document Intelligence Service.

These models define the public contract between callers (API endpoints, tests,
CLI scripts) and the service internals.  They are intentionally decoupled from
any ORM or database model.

Contract summary
----------------
Input:  ``ExtractionRequest``
Output: ``ExtractionResponse``

The ``ExtractionResponse`` always satisfies:

    {
        "document_type": "<string>",
        "fields": {
            "<field_name>": {
                "value": "<string | null>",
                "confidence": <float 0.0–1.0>
            },
            ...
        },
        "warnings": ["<string>", ...]
    }
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Template model (mirrors the JSON template files)
# ---------------------------------------------------------------------------

class DocumentTemplate(BaseModel):
    """
    In-memory representation of a document template loaded from
    ``app/templates/<document_type>.json``.

    This is validated on load by ``TemplateLoader`` and cached for reuse.
    """

    document_type: str = Field(..., description="Canonical identifier, e.g. 'aadhaar'.")
    template_id: str = Field(default="", description="Unique template identifier.")
    category: str = Field(default="Other", description="Document category (Identity, Certificates, Family, Financial, Education).")
    display_name: str = Field(..., description="Human-readable name, e.g. 'Aadhaar Card'.")
    description: str = Field(default="", description="One-sentence description of the document.")
    document_aliases: List[str] = Field(
        default_factory=list,
        description="Keywords used by TemplateMatcher to detect this document type in OCR text.",
    )
    extraction_notes: str = Field(default="", description="Notes for developers about extraction quirks.")
    supports_expiry: bool = Field(default=False, description="Whether this document has an expiry date.")
    supports_notifications: bool = Field(default=False, description="Whether to send expiry notifications.")
    required_fields: List[str] = Field(
        default_factory=list,
        description="Fields the LLM must always attempt to extract.",
    )
    optional_fields: List[str] = Field(
        default_factory=list,
        description="Fields the LLM should extract if present.",
    )
    field_hints: Dict[str, str] = Field(
        default_factory=dict,
        description="Per-field textual hints given to the LLM.",
    )
    field_types: Dict[str, str] = Field(
        default_factory=dict,
        description="Maps field names to validation types (e.g., 'aadhaar', 'date').",
    )
    aliases: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Synonyms/alternative labels that may appear in OCR text.",
    )
    output_field_names: Dict[str, str] = Field(
        default_factory=dict,
        description="Canonical output key names (may differ from input labels).",
    )
    validation_hints: Dict[str, str] = Field(
        default_factory=dict,
        description="Post-extraction validation rules described in plain text.",
    )

    @model_validator(mode="after")
    def all_required_fields_have_output_names(self) -> "DocumentTemplate":
        """
        Every required field should appear in output_field_names so the
        response parser can canonicalise keys without guessing.
        """
        if not self.output_field_names:
            # Tolerate missing output_field_names by defaulting to identity map.
            self.output_field_names = {f: f for f in self.required_fields + self.optional_fields}
        return self

    @property
    def all_fields(self) -> List[str]:
        """Union of required and optional fields."""
        return self.required_fields + self.optional_fields


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class ExtractionRequest(BaseModel):
    """
    Input to ``DocumentIntelligenceService.extract()``.

    Parameters
    ----------
    document_type:
        Canonical document type string, e.g. ``"aadhaar"``, ``"pan"``,
        ``"passport"``, ``"driving_license"``.  Used to look up the matching
        template unless ``template`` is provided explicitly.
    raw_ocr_text:
        The full text output from the upstream OCR service.  Must not be empty.
    image_url:
        Optional URL of the source document image (Cloudinary CDN URL).
        Some LLM providers can accept image inputs alongside text; passing this
        allows future multimodal engines to use it.
    template:
        Optional pre-loaded template dict to override automatic template
        discovery.  Useful in tests and when callers need to customise
        extraction behaviour without adding a JSON file.
    """

    document_type: str = Field(
        ...,
        min_length=1,
        description="Canonical document type identifier, e.g. 'aadhaar'.",
    )
    raw_ocr_text: str = Field(
        ...,
        min_length=1,
        description="Raw text output from the OCR service.  Must not be empty.",
    )
    image_url: Optional[str] = Field(
        default=None,
        description="Optional CDN URL of the source document image.",
    )
    template: Optional[Dict[str, Any]] = Field(
        default=None,
        description=(
            "Optional explicit template dict.  When provided, the TemplateLoader "
            "is bypassed and this dict is validated and used directly."
        ),
    )

    @field_validator("document_type", mode="before")
    @classmethod
    def normalise_document_type(cls, v: str) -> str:
        """Lower-case and strip whitespace so callers can pass 'Aadhaar' or 'AADHAAR'."""
        return v.strip().lower()

    @field_validator("raw_ocr_text", mode="before")
    @classmethod
    def strip_ocr_text(cls, v: str) -> str:
        return v.strip()


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class FieldResult(BaseModel):
    """
    Extraction result for a single document field.

    Attributes
    ----------
    value:
        Extracted string value, or ``None`` if the field was not found.
    confidence:
        Confidence score in [0.0, 1.0] where 1.0 = certain and 0.0 = not found.
    """

    value: Optional[str] = Field(
        default=None,
        description="Extracted value, or null if the field was not found in the OCR text.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Extraction confidence score between 0.0 (absent) and 1.0 (certain).",
    )

    @field_validator("confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, v: Any) -> float:
        """Clamp to [0.0, 1.0] to handle LLM rounding errors."""
        try:
            f = float(v)
        except (TypeError, ValueError):
            return 0.0
        return max(0.0, min(1.0, f))


class ExtractionResponse(BaseModel):
    """
    Structured output from ``DocumentIntelligenceService.extract()``.

    This is the canonical response shape used across the entire pipeline.
    It is always serialisable to JSON with no extra processing.

    Example
    -------
    ::

        {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": {"value": "1234 5678 9012", "confidence": 0.98},
                "full_name":      {"value": "Ravi Kumar",     "confidence": 0.95},
                "address":        {"value": null,             "confidence": 0.0}
            },
            "warnings": ["address field not found in OCR text"]
        }
    """

    document_type: str = Field(..., description="Canonical document type.")
    fields: Dict[str, FieldResult] = Field(
        default_factory=dict,
        description="Extracted fields keyed by canonical output field name.",
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Non-fatal issues detected during extraction or validation.",
    )

    @property
    def overall_confidence(self) -> float:
        """
        Mean confidence score across all extracted fields.
        Returns 0.0 if there are no fields.
        """
        if not self.fields:
            return 0.0
        return sum(f.confidence for f in self.fields.values()) / len(self.fields)

    @property
    def missing_required_fields(self) -> List[str]:
        """
        Return field names where value is None (i.e. not extracted).
        Useful for downstream validation.
        """
        return [name for name, result in self.fields.items() if result.value is None]
