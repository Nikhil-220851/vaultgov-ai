import re
from typing import Tuple, List, Optional
from app.copilot.planner.planner_types import Intent, ContextSource

class RuleEngine:
    def __init__(self):
        self.rules = [
            self._check_greeting,
            self._check_help,
            self._check_document_renewal,
            self._check_document_upload,
            self._check_document_expiry,
            self._check_document_status,
            self._check_eligibility,
            self._check_schemes,
            self._check_profile,
        ]

    def evaluate(self, text: str) -> Tuple[Intent, float, List[ContextSource], str]:
        text_lower = text.lower()
        
        for rule in self.rules:
            result = rule(text_lower)
            if result:
                return result
                
        # Fallback to general chat
        return (
            Intent.GENERAL_CHAT,
            0.5,
            [ContextSource.HISTORY],
            "No specific intent detected. Falling back to general chat."
        )

    def _check_greeting(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if re.match(r'^(hi|hello|hey|greetings)\b', text):
            return (Intent.GREETING, 0.9, [ContextSource.PROFILE], "Matched greeting keywords.")
        return None

    def _check_help(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "help" in text or "what can you do" in text:
            return (Intent.HELP, 0.9, [], "Matched help keywords.")
        return None

    def _check_document_renewal(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "renew" in text:
            return (Intent.DOCUMENT_RENEWAL, 0.8, [ContextSource.DOCUMENTS, ContextSource.SCHEMES], "Matched 'renew' keyword.")
        return None
        
    def _check_document_upload(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "upload" in text or "add document" in text:
            return (Intent.DOCUMENT_UPLOAD, 0.8, [ContextSource.DOCUMENTS, ContextSource.OCR], "Matched upload keywords.")
        return None

    def _check_document_expiry(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "expire" in text or "expiration" in text or "expiring" in text:
            return (Intent.DOCUMENT_EXPIRY, 0.9, [ContextSource.DOCUMENTS], "Matched expiry keywords.")
        return None

    def _check_document_status(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "document" in text or re.search(r'\bfile\b', text) or re.search(r'\bid\b', text) or "passport" in text:
            return (Intent.DOCUMENT_STATUS, 0.7, [ContextSource.DOCUMENTS], "Matched general document keywords.")
        return None

    def _check_eligibility(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "eligible" in text or "qualify" in text or "can i get" in text or "am i entitled" in text:
            return (Intent.ELIGIBILITY_CHECK, 0.85, [ContextSource.PROFILE, ContextSource.SCHEMES, ContextSource.DOCUMENTS], "Matched eligibility keywords.")
        return None

    def _check_schemes(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "scheme" in text or "program" in text or "benefit" in text or "grant" in text:
            return (Intent.SCHEME_DISCOVERY, 0.8, [ContextSource.SCHEMES], "Matched scheme keywords.")
        return None

    def _check_profile(self, text: str) -> Optional[Tuple[Intent, float, List[ContextSource], str]]:
        if "profile" in text or "my info" in text or "my details" in text:
            return (Intent.PROFILE, 0.9, [ContextSource.PROFILE], "Matched profile keywords.")
        return None
