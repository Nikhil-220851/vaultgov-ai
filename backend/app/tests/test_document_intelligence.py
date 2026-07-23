"""
tests/test_document_intelligence.py
=====================================
Unit tests for the Document Intelligence Service (Phase 2).

All tests are fully offline — no real Gemini API calls are made.
The LLM engine is replaced by an ``AsyncMock`` that returns pre-canned JSON,
so these tests can run in CI without any API key.

Test groups
-----------
1. ``TestTemplateLoader``   — disk loading, caching, error paths.
2. ``TestPromptBuilder``    — prompt structure and content.
3. ``TestResponseParser``   — happy path, flat values, missing fields,
                               markdown fences, bad JSON.
4. ``TestDocumentIntelligenceService`` — full pipeline via mocked engine.
5. ``TestExceptionHierarchy`` — confirm all exceptions inherit correctly.

Run with::

    cd backend
    python -m pytest app/tests/test_document_intelligence.py -v
"""

from __future__ import annotations

import asyncio
import json
import os
import tempfile
from pathlib import Path
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Module imports
# ---------------------------------------------------------------------------
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
from app.services.document_intelligence.prompt_builder import PromptBuilder
from app.services.document_intelligence.response_parser import ResponseParser
from app.services.document_intelligence.template_loader import TemplateLoader
from app.services.document_intelligence.document_intelligence_service import (
    DocumentIntelligenceService,
)


# ===========================================================================
# Fixtures
# ===========================================================================

@pytest.fixture()
def templates_dir() -> Path:
    """Real templates directory shipped with the project."""
    return (
        Path(__file__).parent.parent / "templates"
    ).resolve()


@pytest.fixture()
def aadhaar_template(templates_dir: Path) -> DocumentTemplate:
    loader = TemplateLoader(templates_dir=templates_dir)
    return loader.load("aadhaar")


@pytest.fixture()
def pan_template(templates_dir: Path) -> DocumentTemplate:
    loader = TemplateLoader(templates_dir=templates_dir)
    return loader.load("pan")


@pytest.fixture()
def passport_template(templates_dir: Path) -> DocumentTemplate:
    loader = TemplateLoader(templates_dir=templates_dir)
    return loader.load("passport")


@pytest.fixture()
def driving_license_template(templates_dir: Path) -> DocumentTemplate:
    loader = TemplateLoader(templates_dir=templates_dir)
    return loader.load("driving_license")


@pytest.fixture()
def sample_aadhaar_ocr() -> str:
    return (
        "Government of India\n"
        "Aadhaar\n"
        "Ravi Kumar\n"
        "DOB: 15/08/1990\n"
        "Male\n"
        "123 Main Street, New Delhi, 110001\n"
        "1234 5678 9012\n"
    )


@pytest.fixture()
def sample_pan_ocr() -> str:
    return (
        "Income Tax Department\n"
        "Permanent Account Number Card\n"
        "ABCDE1234F\n"
        "Name: Ravi Kumar\n"
        "Father's Name: Suresh Kumar\n"
        "Date of Birth: 15/08/1990\n"
    )


@pytest.fixture()
def good_aadhaar_llm_response(aadhaar_template: DocumentTemplate) -> str:
    """Simulated LLM JSON response for an Aadhaar extraction."""
    fields: Dict[str, Any] = {
        "aadhaar_number": {"value": "1234 5678 9012", "confidence": 0.98},
        "full_name":      {"value": "Ravi Kumar",     "confidence": 0.95},
        "date_of_birth":  {"value": "15/08/1990",     "confidence": 0.97},
        "gender":         {"value": "Male",            "confidence": 0.99},
        "address":        {"value": "123 Main Street, New Delhi, 110001", "confidence": 0.90},
        "mobile_number":  {"value": None,              "confidence": 0.0},
        "email":          {"value": None,              "confidence": 0.0},
        "vid":            {"value": None,              "confidence": 0.0},
        "issue_date":     {"value": None,              "confidence": 0.0},
    }
    return json.dumps({
        "document_type": "aadhaar",
        "fields": fields,
        "warnings": [],
    })


# ===========================================================================
# 1. TemplateLoader tests
# ===========================================================================

class TestTemplateLoader:

    def test_loads_all_four_templates(self, templates_dir: Path) -> None:
        loader = TemplateLoader(templates_dir=templates_dir)
        for doc_type in ("aadhaar", "pan", "passport", "driving_license"):
            template = loader.load(doc_type)
            assert template.document_type == doc_type, (
                f"Expected document_type='{doc_type}' but got '{template.document_type}'"
            )

    def test_list_available_returns_four(self, templates_dir: Path) -> None:
        loader = TemplateLoader(templates_dir=templates_dir)
        available = loader.list_available()
        assert set(available) >= {"aadhaar", "pan", "passport", "driving_license"}

    def test_cache_hit_returns_same_object(self, templates_dir: Path) -> None:
        loader = TemplateLoader(templates_dir=templates_dir)
        t1 = loader.load("aadhaar")
        t2 = loader.load("aadhaar")
        assert t1 is t2, "Second load should return the cached object."

    def test_clear_cache_forces_disk_reload(self, templates_dir: Path) -> None:
        loader = TemplateLoader(templates_dir=templates_dir)
        t1 = loader.load("pan")
        loader.clear_cache()
        t2 = loader.load("pan")
        assert t1 is not t2, "After cache clear a fresh object should be loaded."

    def test_unknown_document_type_raises(self, templates_dir: Path) -> None:
        loader = TemplateLoader(templates_dir=templates_dir)
        with pytest.raises(TemplateNotFoundError) as exc_info:
            loader.load("nonexistent_document")
        assert "nonexistent_document" in str(exc_info.value)

    def test_template_validation_error_on_bad_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            bad_file = Path(tmp_dir) / "broken.json"
            bad_file.write_text("{this is not valid json}", encoding="utf-8")
            loader = TemplateLoader(templates_dir=Path(tmp_dir))
            with pytest.raises(TemplateValidationError):
                loader.load("broken")

    def test_aadhaar_required_fields(self, aadhaar_template: DocumentTemplate) -> None:
        assert "aadhaar_number" in aadhaar_template.required_fields
        assert "full_name" in aadhaar_template.required_fields
        assert "date_of_birth" in aadhaar_template.required_fields
        assert "gender" in aadhaar_template.required_fields
        assert "address" in aadhaar_template.required_fields

    def test_pan_required_fields(self, pan_template: DocumentTemplate) -> None:
        assert "pan_number" in pan_template.required_fields
        assert "full_name" in pan_template.required_fields
        assert "father_name" in pan_template.required_fields
        assert "date_of_birth" in pan_template.required_fields

    def test_passport_has_mrz_optional_fields(self, passport_template: DocumentTemplate) -> None:
        assert "mrz_line1" in passport_template.optional_fields
        assert "mrz_line2" in passport_template.optional_fields

    def test_driving_license_vehicle_classes_required(
        self, driving_license_template: DocumentTemplate
    ) -> None:
        assert "vehicle_classes" in driving_license_template.required_fields


# ===========================================================================
# 2. PromptBuilder tests
# ===========================================================================

class TestPromptBuilder:

    def _build(self, doc_type: str, ocr_text: str, template: DocumentTemplate) -> str:
        builder = PromptBuilder()
        request = ExtractionRequest(document_type=doc_type, raw_ocr_text=ocr_text)
        return builder.build(request, template)

    def test_prompt_contains_ocr_text(
        self, aadhaar_template: DocumentTemplate, sample_aadhaar_ocr: str
    ) -> None:
        prompt = self._build("aadhaar", sample_aadhaar_ocr, aadhaar_template)
        assert "Ravi Kumar" in prompt

    def test_prompt_contains_required_field_names(
        self, aadhaar_template: DocumentTemplate, sample_aadhaar_ocr: str
    ) -> None:
        prompt = self._build("aadhaar", sample_aadhaar_ocr, aadhaar_template)
        for field in aadhaar_template.required_fields:
            output_key = aadhaar_template.output_field_names.get(field, field)
            assert output_key in prompt, f"Field '{output_key}' missing from prompt."

    def test_prompt_contains_json_contract(
        self, pan_template: DocumentTemplate, sample_pan_ocr: str
    ) -> None:
        prompt = self._build("pan", sample_pan_ocr, pan_template)
        assert "confidence" in prompt
        assert "OUTPUT CONTRACT" in prompt

    def test_prompt_no_hardcoded_document_type(
        self, aadhaar_template: DocumentTemplate, sample_aadhaar_ocr: str
    ) -> None:
        """Prompt must use the template's display name, not a hardcoded string."""
        prompt = self._build("aadhaar", sample_aadhaar_ocr, aadhaar_template)
        assert aadhaar_template.display_name in prompt

    def test_prompt_contains_field_hints(
        self, aadhaar_template: DocumentTemplate, sample_aadhaar_ocr: str
    ) -> None:
        prompt = self._build("aadhaar", sample_aadhaar_ocr, aadhaar_template)
        # At least one hint value should appear
        any_hint_present = any(
            hint[:20] in prompt
            for hint in aadhaar_template.field_hints.values()
            if hint
        )
        assert any_hint_present, "No field hints found in the generated prompt."

    def test_prompt_is_string(
        self, passport_template: DocumentTemplate
    ) -> None:
        builder = PromptBuilder()
        request = ExtractionRequest(document_type="passport", raw_ocr_text="some ocr text")
        result = builder.build(request, passport_template)
        assert isinstance(result, str)
        assert len(result) > 100


# ===========================================================================
# 3. ResponseParser tests
# ===========================================================================

class TestResponseParser:

    def test_happy_path(
        self, aadhaar_template: DocumentTemplate, good_aadhaar_llm_response: str
    ) -> None:
        parser = ResponseParser()
        response = parser.parse(good_aadhaar_llm_response, aadhaar_template)
        assert isinstance(response, ExtractionResponse)
        assert response.document_type == "aadhaar"
        assert response.fields["aadhaar_number"].value == "1234 5678 9012"
        assert response.fields["aadhaar_number"].confidence == pytest.approx(0.98)
        assert response.fields["full_name"].value == "Ravi Kumar"

    def test_strips_markdown_fences(
        self, aadhaar_template: DocumentTemplate, good_aadhaar_llm_response: str
    ) -> None:
        wrapped = f"```json\n{good_aadhaar_llm_response}\n```"
        parser = ResponseParser()
        response = parser.parse(wrapped, aadhaar_template)
        assert response.fields["aadhaar_number"].value == "1234 5678 9012"

    def test_null_values_produce_zero_confidence(
        self, aadhaar_template: DocumentTemplate, good_aadhaar_llm_response: str
    ) -> None:
        parser = ResponseParser()
        response = parser.parse(good_aadhaar_llm_response, aadhaar_template)
        assert response.fields["mobile_number"].value is None
        assert response.fields["mobile_number"].confidence == 0.0

    def test_missing_field_is_filled_with_null(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        # LLM omits 'address' field entirely
        partial = {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": {"value": "1234 5678 9012", "confidence": 0.98},
                "full_name":      {"value": "Ravi Kumar",     "confidence": 0.95},
                "date_of_birth":  {"value": "15/08/1990",     "confidence": 0.97},
                "gender":         {"value": "Male",           "confidence": 0.99},
            },
            "warnings": [],
        }
        parser = ResponseParser()
        response = parser.parse(json.dumps(partial), aadhaar_template)
        # address was missing from LLM output — should be injected as null
        assert "address" in response.fields
        assert response.fields["address"].value is None

    def test_flat_value_style_is_coerced(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        """Some models return flat string values instead of {value, confidence}."""
        flat = {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": "1234 5678 9012",
                "full_name": "Ravi Kumar",
                "date_of_birth": "15/08/1990",
                "gender": "Male",
                "address": "123 Main Street",
            },
            "warnings": [],
        }
        parser = ResponseParser()
        response = parser.parse(json.dumps(flat), aadhaar_template)
        assert response.fields["aadhaar_number"].value == "1234 5678 9012"
        assert response.fields["aadhaar_number"].confidence == pytest.approx(0.6)

    def test_invalid_json_raises_response_parse_error(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        parser = ResponseParser()
        with pytest.raises(ResponseParseError):
            parser.parse("this is not json at all", aadhaar_template)

    def test_required_field_missing_adds_warning(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        """Required fields with null value should trigger a warning."""
        no_address = {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": {"value": "1234 5678 9012", "confidence": 0.98},
                "full_name":      {"value": "Ravi Kumar",     "confidence": 0.95},
                "date_of_birth":  {"value": "15/08/1990",     "confidence": 0.97},
                "gender":         {"value": "Male",           "confidence": 0.99},
                "address":        {"value": None,             "confidence": 0.0},
            },
            "warnings": [],
        }
        parser = ResponseParser()
        response = parser.parse(json.dumps(no_address), aadhaar_template)
        warning_text = " ".join(response.warnings)
        assert "address" in warning_text

    def test_confidence_clamped_to_range(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        """Confidence values outside [0, 1] should be clamped."""
        bad_confidence = {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": {"value": "1234 5678 9012", "confidence": 1.5},
                "full_name":      {"value": "Ravi Kumar",     "confidence": -0.3},
            },
            "warnings": [],
        }
        parser = ResponseParser()
        response = parser.parse(json.dumps(bad_confidence), aadhaar_template)
        assert response.fields["aadhaar_number"].confidence <= 1.0
        assert response.fields["full_name"].confidence >= 0.0

    def test_overall_confidence_property(
        self, aadhaar_template: DocumentTemplate, good_aadhaar_llm_response: str
    ) -> None:
        parser = ResponseParser()
        response = parser.parse(good_aadhaar_llm_response, aadhaar_template)
        assert 0.0 <= response.overall_confidence <= 1.0

    def test_missing_required_fields_property(
        self, aadhaar_template: DocumentTemplate
    ) -> None:
        partial = {
            "document_type": "aadhaar",
            "fields": {
                "aadhaar_number": {"value": None, "confidence": 0.0},
                "full_name":      {"value": "Ravi Kumar", "confidence": 0.9},
            },
            "warnings": [],
        }
        parser = ResponseParser()
        response = parser.parse(json.dumps(partial), aadhaar_template)
        missing = response.missing_required_fields
        assert "aadhaar_number" in missing
        assert "full_name" not in missing


# ===========================================================================
# 4. DocumentIntelligenceService (full pipeline, mocked engine)
# ===========================================================================

class TestDocumentIntelligenceService:

    def _make_service(self, mock_response: str, templates_dir: Path) -> DocumentIntelligenceService:
        mock_engine = AsyncMock()
        mock_engine.provider_name = "mock"
        mock_engine.extract = AsyncMock(return_value=mock_response)
        return DocumentIntelligenceService(
            engine=mock_engine,
            template_loader=TemplateLoader(templates_dir=templates_dir),
        )

    def test_extract_returns_extraction_response(
        self,
        templates_dir: Path,
        good_aadhaar_llm_response: str,
        sample_aadhaar_ocr: str,
    ) -> None:
        svc = self._make_service(good_aadhaar_llm_response, templates_dir)
        request = ExtractionRequest(
            document_type="aadhaar",
            raw_ocr_text=sample_aadhaar_ocr,
        )
        response = asyncio.run(svc.extract(request))
        assert isinstance(response, ExtractionResponse)
        assert response.document_type == "aadhaar"

    def test_extract_aadhaar_number_correctly(
        self,
        templates_dir: Path,
        good_aadhaar_llm_response: str,
        sample_aadhaar_ocr: str,
    ) -> None:
        svc = self._make_service(good_aadhaar_llm_response, templates_dir)
        request = ExtractionRequest(
            document_type="aadhaar",
            raw_ocr_text=sample_aadhaar_ocr,
        )
        response = asyncio.run(svc.extract(request))
        assert response.fields["aadhaar_number"].value == "1234 5678 9012"
        assert response.fields["aadhaar_number"].confidence > 0.9

    def test_document_type_normalised_to_lowercase(
        self,
        templates_dir: Path,
        good_aadhaar_llm_response: str,
        sample_aadhaar_ocr: str,
    ) -> None:
        svc = self._make_service(good_aadhaar_llm_response, templates_dir)
        request = ExtractionRequest(
            document_type="AADHAAR",  # uppercase input
            raw_ocr_text=sample_aadhaar_ocr,
        )
        response = asyncio.run(svc.extract(request))
        assert response.document_type == "aadhaar"

    def test_inline_template_bypasses_loader(
        self, templates_dir: Path, sample_pan_ocr: str
    ) -> None:
        """Passing an inline template dict should skip disk loading entirely."""
        inline_template = {
            "document_type": "custom_doc",
            "display_name": "Custom Document",
            "description": "A test document.",
            "required_fields": ["custom_field"],
            "optional_fields": [],
            "field_hints": {"custom_field": "A custom field."},
            "aliases": {},
            "output_field_names": {"custom_field": "custom_field"},
            "validation_hints": {},
        }
        mock_llm_response = json.dumps({
            "document_type": "custom_doc",
            "fields": {"custom_field": {"value": "hello", "confidence": 0.9}},
            "warnings": [],
        })
        svc = self._make_service(mock_llm_response, templates_dir)
        request = ExtractionRequest(
            document_type="custom_doc",
            raw_ocr_text="some ocr text",
            template=inline_template,
        )
        response = asyncio.run(svc.extract(request))
        assert response.fields["custom_field"].value == "hello"

    def test_unknown_doc_type_raises_template_not_found(
        self, templates_dir: Path, sample_aadhaar_ocr: str
    ) -> None:
        svc = self._make_service("{}", templates_dir)
        request = ExtractionRequest(
            document_type="unknown_type",
            raw_ocr_text=sample_aadhaar_ocr,
        )
        with pytest.raises(TemplateNotFoundError):
            asyncio.run(svc.extract(request))

    def test_engine_error_is_propagated(
        self, templates_dir: Path, sample_aadhaar_ocr: str
    ) -> None:
        mock_engine = AsyncMock()
        mock_engine.provider_name = "mock"
        mock_engine.extract = AsyncMock(
            side_effect=ExtractionEngineError("mock", "API timeout")
        )
        svc = DocumentIntelligenceService(
            engine=mock_engine,
            template_loader=TemplateLoader(templates_dir=templates_dir),
        )
        request = ExtractionRequest(
            document_type="aadhaar",
            raw_ocr_text=sample_aadhaar_ocr,
        )
        with pytest.raises(ExtractionEngineError):
            asyncio.run(svc.extract(request))

    def test_list_supported_document_types(self, templates_dir: Path) -> None:
        mock_engine = AsyncMock()
        mock_engine.provider_name = "mock"
        svc = DocumentIntelligenceService(
            engine=mock_engine,
            template_loader=TemplateLoader(templates_dir=templates_dir),
        )
        types = svc.list_supported_document_types()
        assert "aadhaar" in types
        assert "pan" in types
        assert "passport" in types
        assert "driving_license" in types

    def test_image_url_included_in_request(
        self,
        templates_dir: Path,
        good_aadhaar_llm_response: str,
        sample_aadhaar_ocr: str,
    ) -> None:
        mock_engine = AsyncMock()
        mock_engine.provider_name = "mock"
        mock_engine.extract = AsyncMock(return_value=good_aadhaar_llm_response)

        svc = DocumentIntelligenceService(
            engine=mock_engine,
            template_loader=TemplateLoader(templates_dir=templates_dir),
        )
        request = ExtractionRequest(
            document_type="aadhaar",
            raw_ocr_text=sample_aadhaar_ocr,
            image_url="https://res.cloudinary.com/example/image.jpg",
        )
        response = asyncio.run(svc.extract(request))
        # Verify the engine was called (prompt should have included the image_url)
        mock_engine.extract.assert_called_once()
        prompt_used: str = mock_engine.extract.call_args[0][0]
        assert "https://res.cloudinary.com/example/image.jpg" in prompt_used


# ===========================================================================
# 5. Exception hierarchy
# ===========================================================================

class TestExceptionHierarchy:

    def test_template_not_found_is_di_error(self) -> None:
        exc = TemplateNotFoundError("aadhaar")
        assert isinstance(exc, DocumentIntelligenceError)

    def test_template_validation_is_di_error(self) -> None:
        exc = TemplateValidationError("pan", "bad json")
        assert isinstance(exc, DocumentIntelligenceError)

    def test_extraction_engine_error_is_di_error(self) -> None:
        exc = ExtractionEngineError("gemini", "rate limit")
        assert isinstance(exc, DocumentIntelligenceError)

    def test_response_parse_error_is_di_error(self) -> None:
        exc = ResponseParseError("no fields key")
        assert isinstance(exc, DocumentIntelligenceError)

    def test_template_not_found_carries_doc_type(self) -> None:
        exc = TemplateNotFoundError("driving_license")
        assert exc.document_type == "driving_license"

    def test_extraction_engine_error_carries_provider(self) -> None:
        exc = ExtractionEngineError("gemini", "quota exceeded")
        assert exc.provider == "gemini"

    def test_response_parse_error_carries_raw_response(self) -> None:
        exc = ResponseParseError("decode failed", raw_response="bad text")
        assert exc.raw_response == "bad text"
