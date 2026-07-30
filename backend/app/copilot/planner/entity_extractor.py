import re
from typing import Dict, Any

class EntityExtractor:
    @staticmethod
    def extract_document_types(text: str) -> list[str]:
        doc_types = []
        text_lower = text.lower()
        if "passport" in text_lower:
            doc_types.append("passport")
        if "driving license" in text_lower or "driver's license" in text_lower or "license" in text_lower or "driving licence" in text_lower or "licence" in text_lower or "dl" in text_lower:
            doc_types.append("driving_license")
        if "aadhaar" in text_lower or "aadhar" in text_lower:
            doc_types.append("aadhaar")
        if "pan" in text_lower:
            doc_types.append("pan_card")
        if re.search(r'\bid\b', text_lower) or "identity" in text_lower:
            doc_types.append("id_card")
        if "tax" in text_lower or "w2" in text_lower or "1099" in text_lower:
            doc_types.append("tax_document")
        return doc_types

    @staticmethod
    def extract_scheme_names(text: str) -> list[str]:
        schemes = []
        text_lower = text.lower()
        if "childcare" in text_lower:
            schemes.append("childcare_subsidy")
        if "healthcare" in text_lower or "medicare" in text_lower:
            schemes.append("healthcare")
        if "housing" in text_lower:
            schemes.append("housing_assistance")
        return schemes

    @staticmethod
    def extract(text: str) -> Dict[str, Any]:
        return {
            "document_types": EntityExtractor.extract_document_types(text),
            "scheme_names": EntityExtractor.extract_scheme_names(text)
        }
