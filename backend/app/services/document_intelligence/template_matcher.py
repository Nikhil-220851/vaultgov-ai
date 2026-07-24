import logging
from typing import Dict, Any, List
from app.services.document_intelligence.template_loader import TemplateLoader
from app.services.document_intelligence.models import DocumentTemplate

logger = logging.getLogger(__name__)

class TemplateMatcher:
    """
    Service responsible for detecting the document type from OCR text
    using the document_aliases defined in the JSON templates.
    """

    def __init__(self, template_loader: TemplateLoader = None, default_threshold: float = 70.0):
        self._template_loader = template_loader or TemplateLoader()
        self._default_threshold = default_threshold

    def match(self, ocr_text: str, threshold: float = None) -> Dict[str, Any]:
        """
        Scan OCR text against all loaded templates and return the best match.
        
        Algorithm:
        For each template, find matching keywords from `document_aliases`.
        Confidence score = min(100, len(matched_keywords) * 75.0)
        This ensures 1 matched keyword gives 75% confidence (passing a 70% threshold).
        
        Returns:
            Dict containing template_id, display_name, category, confidence_score, matched_keywords
        """
        threshold = threshold if threshold is not None else self._default_threshold
        text_lower = ocr_text.lower()
        
        available_templates = self._template_loader.list_available()
        best_match = None
        highest_score = 0.0
        best_keywords = []
        best_display_name = "Unknown Document"
        best_category = "Other"
        
        for template_id in available_templates:
            try:
                template: DocumentTemplate = self._template_loader.load(template_id)
                aliases = template.document_aliases or []
                
                matched = [alias for alias in aliases if alias in text_lower]
                
                # Calculate confidence score
                score = min(100.0, len(matched) * 75.0)
                
                if score > highest_score:
                    highest_score = score
                    best_match = template_id
                    best_keywords = matched
                    best_display_name = template.display_name
                    best_category = template.category
                    
            except Exception as e:
                logger.warning(f"Error loading template {template_id} during matching: {e}")
                
        if best_match and highest_score >= threshold:
            logger.info(f"Matched template '{best_match}' with score {highest_score}% (Keywords: {best_keywords})")
            return {
                "template_id": best_match,
                "display_name": best_display_name,
                "category": best_category,
                "confidence_score": highest_score,
                "matched_keywords": best_keywords
            }
            
        logger.info(f"No template met the threshold of {threshold}%. Highest was {highest_score}%. Returning unknown.")
        return {
            "template_id": "unknown",
            "display_name": "Unknown Document",
            "category": "Other",
            "confidence_score": 0.0,
            "matched_keywords": []
        }
