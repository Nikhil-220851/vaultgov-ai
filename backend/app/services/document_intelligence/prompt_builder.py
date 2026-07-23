"""
prompt_builder.py
=================
Assembles the LLM prompt from an ``ExtractionRequest`` and a resolved
``DocumentTemplate``.

Design principles
-----------------
* **No hardcoded prompts in the service layer.**  All prompt copy lives here.
* **Deterministic.**  Same inputs always produce the same prompt string.
* **Extensible.**  Subclass ``PromptBuilder`` and override ``build()`` to add
  chain-of-thought, few-shot examples, or multimodal content without touching
  any other file.

The generated prompt instructs the LLM to:
1. Return **only** valid JSON — no markdown fences, no explanations.
2. Produce exactly one key per field listed in the template.
3. Assign a per-field ``confidence`` score in [0.0, 1.0].
4. Use ``null`` for fields that cannot be found in the OCR text.
5. Populate a ``warnings`` list with any anomalies it detects.

Usage
-----
::

    builder = PromptBuilder()
    prompt = builder.build(request, template)
    # prompt is a plain string ready to send to an LLM
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from app.services.document_intelligence.models import DocumentTemplate, ExtractionRequest

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JSON contract embedded in every prompt so the LLM knows the exact shape.
# ---------------------------------------------------------------------------
_JSON_CONTRACT_EXAMPLE = """{
  "document_type": "<document_type>",
  "fields": {
    "<field_name>": {
      "value": "<extracted string or null>",
      "confidence": <float between 0.0 and 1.0>
    }
  },
  "warnings": ["<optional warning string>"]
}"""

_SYSTEM_INSTRUCTIONS = """\
You are a document field extraction engine. Your ONLY job is to extract \
structured data from the OCR text of an identity document.

STRICT OUTPUT RULES — violating any of these rules will cause a system error:
1. Return ONLY a valid JSON object. Do NOT return markdown. Do NOT explain. Do NOT wrap JSON inside code blocks. Do NOT return multiple JSON objects.
2. The JSON must exactly match the schema shown in the CONTRACT section below.
3. Every field listed under FIELDS TO EXTRACT must appear in the output.
4. If a field cannot be found in the OCR text, set "value" to null and "confidence" to 0.0.
5. Confidence scores must be floats in [0.0, 1.0]. 1.0 = fully certain, 0.0 = not found. Do NOT include confidence text.
6. The "warnings" array must be present (may be empty). Add a warning string for each \
anomaly you detect (e.g. partial OCR, conflicting values, format violations).
7. Do NOT add extra keys beyond those listed in FIELDS TO EXTRACT.
"""


class PromptBuilder:
    """
    Builds LLM prompt strings for document field extraction.

    All prompt text is centralised here.  To change prompt strategy, subclass
    this and override ``build()`` or the private ``_build_*`` methods.
    """

    def build(
        self,
        request: ExtractionRequest,
        template: DocumentTemplate,
    ) -> str:
        """
        Assemble the full extraction prompt.

        Parameters
        ----------
        request:
            The caller's extraction request (contains OCR text, document type,
            optional image URL).
        template:
            Resolved and validated document template.

        Returns
        -------
        str
            A single prompt string ready to be sent to an LLM.
        """
        sections: list[str] = [
            self._build_system_section(),
            self._build_document_section(request, template),
            self._build_fields_section(template),
            self._build_ocr_section(request.raw_ocr_text),
            self._build_contract_section(request.document_type, template),
            self._build_closing_instruction(),
        ]

        prompt = "\n\n".join(sections)
        logger.debug(
            "Built prompt for document_type='%s'. Prompt length=%d chars.",
            request.document_type,
            len(prompt),
        )
        return prompt

    # ------------------------------------------------------------------
    # Section builders (override individually as needed)
    # ------------------------------------------------------------------

    def _build_system_section(self) -> str:
        return f"## SYSTEM INSTRUCTIONS\n\n{_SYSTEM_INSTRUCTIONS.strip()}"

    def _build_document_section(
        self,
        request: ExtractionRequest,
        template: DocumentTemplate,
    ) -> str:
        lines = [
            "## DOCUMENT INFORMATION",
            "",
            f"Document Type : {template.display_name} ({template.document_type})",
            f"Description   : {template.description}",
        ]
        if request.image_url:
            lines.append(f"Image URL     : {request.image_url}")
        return "\n".join(lines)

    def _build_fields_section(self, template: DocumentTemplate) -> str:
        lines = ["## FIELDS TO EXTRACT"]

        # Required fields
        lines.append("\n### Required fields (MUST be extracted if present)")
        for field in template.required_fields:
            hint = template.field_hints.get(field, "")
            aliases = template.aliases.get(field, [])
            validation = template.validation_hints.get(field, "")
            output_key = template.output_field_names.get(field, field)

            lines.append(f"\n- **{output_key}**")
            if hint:
                lines.append(f"  Hint       : {hint}")
            if aliases:
                lines.append(f"  Aliases    : {', '.join(aliases)}")
            if validation:
                lines.append(f"  Validation : {validation}")

        # Optional fields
        if template.optional_fields:
            lines.append("\n### Optional fields (extract if present, else null)")
            for field in template.optional_fields:
                hint = template.field_hints.get(field, "")
                aliases = template.aliases.get(field, [])
                output_key = template.output_field_names.get(field, field)

                lines.append(f"\n- **{output_key}**")
                if hint:
                    lines.append(f"  Hint    : {hint}")
                if aliases:
                    lines.append(f"  Aliases : {', '.join(aliases)}")

        return "\n".join(lines)

    def _build_ocr_section(self, raw_ocr_text: str) -> str:
        return (
            "## OCR TEXT (raw, may contain noise)\n\n"
            "```\n"
            f"{raw_ocr_text}\n"
            "```"
        )

    def _build_contract_section(
        self,
        document_type: str,
        template: DocumentTemplate,
    ) -> str:
        """
        Build a filled-in JSON skeleton so the LLM sees the exact shape expected.
        """
        # Build the expected fields object
        fields_example: dict = {}
        for field in template.all_fields:
            output_key = template.output_field_names.get(field, field)
            fields_example[output_key] = {"value": None, "confidence": 0.0}

        contract_obj = {
            "document_type": document_type,
            "fields": fields_example,
            "warnings": [],
        }

        contract_json = json.dumps(contract_obj, indent=2, ensure_ascii=False)

        return (
            "## OUTPUT CONTRACT\n\n"
            "Your entire response must be a single JSON object that looks like this "
            "(with real values filled in):\n\n"
            f"```json\n{contract_json}\n```"
        )

    def _build_closing_instruction(self) -> str:
        return (
            "## YOUR RESPONSE\n\n"
            "Output ONLY the JSON object. "
            "Do not include any text before or after the JSON. "
            "Do not wrap it in markdown code fences."
        )
