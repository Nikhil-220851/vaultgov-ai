import re
from typing import Dict, Any

class ValidationResult:
    def __init__(self, score: float, overall_status: str, field_results: dict, required_fields: list = None, supports_expiry: bool = False):
        self.score = score
        self.overall_status = overall_status
        self.field_results = field_results
        self.required_fields = required_fields or []
        self.supports_expiry = supports_expiry

    def to_dict(self):
        return {
            "score": self.score,
            "overall_status": self.overall_status,
            "field_results": self.field_results,
            "required_fields": self.required_fields,
            "supports_expiry": self.supports_expiry,
        }

class ValidationEngine:
    """
    Production-grade validation engine.
    Applies field-specific validators based on the field type declared in the template.
    """

    def validate(self, template: Any, extracted_fields: Dict[str, Any]) -> ValidationResult:
        field_results = {}
        total_fields = 0
        invalid_required = 0
        invalid_optional = 0
        warnings = 0

        # Required fields check
        required_fields = getattr(template, "required_fields", [])
        optional_fields = getattr(template, "optional_fields", [])
        field_types = getattr(template, "field_types", {})

        all_fields = required_fields + optional_fields

        for field_name in all_fields:
            total_fields += 1
            value = extracted_fields.get(field_name)
            is_required = field_name in required_fields
            
            # Extract actual string value if the field is a dict (e.g. {"value": "...", "confidence": 0.9})
            actual_value = None
            if isinstance(value, dict):
                actual_value = value.get("value")
            else:
                actual_value = value

            if actual_value is None or str(actual_value).strip() == "" or actual_value == "null":
                if is_required:
                    field_results[field_name] = {"status": "Invalid", "reason": "Missing required field"}
                    invalid_required += 1
                else:
                    field_results[field_name] = {"status": "Warning", "reason": "Missing optional field"}
                    warnings += 1
                continue

            # Run specific validator if type is defined
            field_type = field_types.get(field_name)
            status, reason = self._run_validator(field_type, str(actual_value), extracted_fields)
            
            field_results[field_name] = {"status": status, "reason": reason}
            
            if status == "Invalid":
                if is_required:
                    invalid_required += 1
                else:
                    invalid_optional += 1
            elif status == "Warning":
                warnings += 1

        # Calculate score
        # Base is 100%. Deduct 25% for every invalid required, 10% for invalid optional, 5% for warnings
        score = 100 - (invalid_required * 25) - (invalid_optional * 10) - (warnings * 5)
        score = max(0, score)

        if invalid_required > 0:
            overall_status = "Invalid"
        elif invalid_optional > 0 or warnings > 0:
            overall_status = "Warning"
        else:
            overall_status = "Valid"

        return ValidationResult(
            score=score,
            overall_status=overall_status,
            field_results=field_results,
            required_fields=required_fields,
            supports_expiry=getattr(template, "supports_expiry", False)
        )

    def _run_validator(self, field_type: str, value: str, all_fields: Dict[str, Any]) -> tuple:
        if not field_type:
            return "Valid", ""

        if field_type == "pan":
            return self.validate_pan(value)
        elif field_type == "aadhaar":
            return self.validate_aadhaar(value)
        elif field_type == "passport":
            return self.validate_passport(value)
        elif field_type == "ifsc":
            return self.validate_ifsc(value)
        elif field_type == "phone":
            return self.validate_phone(value)
        elif field_type == "email":
            return self.validate_email(value)
        elif field_type == "pincode":
            return self.validate_pincode(value)
        elif field_type == "date":
            return self.validate_date(value)
        elif field_type == "income":
            return self.validate_income(value)
        elif field_type == "percentage":
            return self.validate_percentage(value)
        elif field_type == "marks":
            return self.validate_marks(value, all_fields)
        elif field_type == "account_number":
            return self.validate_account_number(value)
        elif field_type == "cheque_number":
            return self.validate_cheque_number(value)
        elif field_type == "registration_number":
            return self.validate_registration_number(value)
        else:
            return "Valid", ""

    # --- Validators ---

    def validate_pan(self, value: str) -> tuple:
        val = value.strip().upper()
        if len(val) != 10:
            return "Invalid", "Must be exactly 10 characters."
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", val):
            return "Invalid", "Expected format ABCDE1234F."
        return "Valid", ""

    def validate_aadhaar(self, value: str) -> tuple:
        val = value.replace(" ", "").replace("-", "")
        if not val.isdigit() or len(val) != 12:
            return "Invalid", "Must contain exactly 12 digits."
        return "Valid", ""

    def validate_passport(self, value: str) -> tuple:
        val = value.strip().upper()
        if not re.match(r"^[A-Z][0-9]{7}$", val):
            return "Warning", "Standard Indian passports start with a letter followed by 7 digits."
        return "Valid", ""

    def validate_ifsc(self, value: str) -> tuple:
        val = value.strip().upper()
        if len(val) != 11:
            return "Invalid", "Must be exactly 11 characters."
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", val):
            return "Warning", "Unusual IFSC format. Expected like SBIN0001234."
        return "Valid", ""

    def validate_phone(self, value: str) -> tuple:
        val = value.replace(" ", "").replace("+91", "").replace("-", "")
        if not val.isdigit() or len(val) != 10:
            return "Invalid", "Must contain exactly 10 digits."
        return "Valid", ""

    def validate_email(self, value: str) -> tuple:
        val = value.strip()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", val):
            return "Invalid", "Invalid email format."
        return "Valid", ""

    def validate_pincode(self, value: str) -> tuple:
        val = value.strip()
        if not val.isdigit() or len(val) != 6:
            return "Invalid", "Must contain exactly 6 digits."
        return "Valid", ""

    def validate_date(self, value: str) -> tuple:
        val = value.strip()
        # Accept DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        if not re.match(r"^(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})$", val):
            return "Warning", "Unable to confidently parse date. Expected DD/MM/YYYY."
        return "Valid", ""

    def validate_income(self, value: str) -> tuple:
        val = value.replace(",", "").replace("Rs", "").replace("INR", "").strip()
        try:
            amount = float(val)
            if amount < 0:
                return "Invalid", "Income must be positive."
            return "Valid", ""
        except ValueError:
            return "Invalid", "Must be numeric."

    def validate_percentage(self, value: str) -> tuple:
        val = value.replace("%", "").strip()
        try:
            pct = float(val)
            if pct < 0 or pct > 100:
                return "Invalid", "Must be between 0 and 100."
            return "Valid", ""
        except ValueError:
            return "Invalid", "Must be numeric."

    def validate_marks(self, value: str, all_fields: Dict[str, Any]) -> tuple:
        val = value.strip()
        try:
            marks = float(val)
            # Try cross validation if total_marks exists
            total = all_fields.get("total_marks")
            if total is not None:
                if isinstance(total, dict):
                    total = total.get("value")
                try:
                    tot_float = float(total)
                    if marks > tot_float:
                        return "Invalid", "Obtained marks cannot exceed total marks."
                except (ValueError, TypeError):
                    pass
            return "Valid", ""
        except ValueError:
            return "Invalid", "Must be numeric."

    def validate_account_number(self, value: str) -> tuple:
        val = value.strip()
        if not val.isdigit():
            return "Invalid", "Must contain digits only."
        if len(val) < 8 or len(val) > 20:
            return "Invalid", "Length must be between 8 and 20 digits."
        return "Valid", ""

    def validate_cheque_number(self, value: str) -> tuple:
        val = value.strip()
        if val == "":
            return "Valid", ""
        if not val.isdigit() or len(val) != 6:
            return "Invalid", "Cheque number must be exactly 6 digits."
        return "Valid", ""

    def validate_registration_number(self, value: str) -> tuple:
        val = value.strip()
        if val == "":
            return "Invalid", "Must not be empty."
        return "Valid", ""
