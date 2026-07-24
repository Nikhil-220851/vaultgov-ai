import re
from datetime import datetime, timezone, timedelta
from dateutil import parser
from typing import Dict, Any, Tuple

class VaultService:
    @staticmethod
    def calculate_smart_expiry(extracted_text: str, supports_expiry: bool) -> Tuple[str, datetime]:
        if not supports_expiry:
            return "NO_EXPIRY", None

        # Try to parse the structured fields from extracted_text
        # Example format:
        # --- STRUCTURED FIELDS ---
        # expiry_date: 12-05-2025
        # valid_until: ...
        
        expiry_date_str = None
        if extracted_text and "--- STRUCTURED FIELDS ---" in extracted_text:
            structured_part = extracted_text.split("--- STRUCTURED FIELDS ---")[1]
            for line in structured_part.strip().split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip().lower()
                    val = val.strip()
                    if key in ["expiry_date", "date_of_expiry", "valid_until", "valid_till", "validity"]:
                        expiry_date_str = val
                        break

        if not expiry_date_str or expiry_date_str.lower() in ["n/a", "null", "none", ""]:
            return "INVALID_DATE", None

        try:
            # Parse date assuming common formats
            # dateutil parser handles DD/MM/YYYY vs MM/DD/YYYY well if dayfirst=True
            parsed_date = parser.parse(expiry_date_str, dayfirst=True)
            # Make timezone aware (UTC)
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            delta_days = (parsed_date - now).days

            if delta_days < 0:
                return "EXPIRED", parsed_date
            elif delta_days <= 30:
                return "EXPIRING_SOON", parsed_date
            else:
                return "ACTIVE", parsed_date
        except Exception:
            return "INVALID_DATE", None

    @staticmethod
    def calculate_health_score(extracted_text: str, validation_result: Dict[str, Any], expiry_status: str, confidence_score: float) -> float:
        score = 100.0
        
        # Penalties from validation (which we might not have stored directly, so we re-read if passed, 
        # but the prompt implies we can calculate it. The prompt says "Formula: 100 - Missing required fields - Validation errors - OCR confidence penalties - Expiry penalties")
        # Since we don't store validation_result in DB, we use what's passed or try to estimate.
        
        if validation_result:
            invalid_count = sum(1 for v in validation_result.get("field_results", {}).values() if v.get("status") == "Invalid")
            score -= (invalid_count * 15)
            warning_count = sum(1 for v in validation_result.get("field_results", {}).values() if v.get("status") == "Warning")
            score -= (warning_count * 5)
        
        # OCR Confidence penalty
        if confidence_score is not None:
            if confidence_score < 0.5:
                score -= 30
            elif confidence_score < 0.8:
                score -= 10
                
        # Expiry penalties
        if expiry_status == "EXPIRED":
            score -= 50
        elif expiry_status == "EXPIRING_SOON":
            score -= 20
        elif expiry_status == "INVALID_DATE":
            score -= 10
            
        return max(0.0, score)

    @staticmethod
    def generate_renewal_priority(status: str) -> str:
        if status == "EXPIRED":
            return "CRITICAL"
        elif status == "EXPIRING_SOON":
            return "HIGH"
        elif status == "ACTIVE":
            return "LOW"
        return "NONE"

vault_service = VaultService()
