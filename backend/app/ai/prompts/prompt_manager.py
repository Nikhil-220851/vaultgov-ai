"""
Prompt Manager.
"""
from app.copilot.types import Intent
from app.ai.prompts.greeting_prompt import GREETING_PROMPT
from app.ai.prompts.eligibility_prompt import ELIGIBILITY_PROMPT
from app.ai.prompts.document_prompt import DOCUMENT_PROMPT
from app.ai.prompts.scheme_prompt import SCHEME_PROMPT
from app.ai.prompts.fallback_prompt import FALLBACK_PROMPT

class PromptManager:
    @staticmethod
    def get_prompt(intent: Intent) -> str:
        """
        Returns the correct prompt according to the intent.
        No business logic or Gemini calls here, just prompt selection.
        """
        if intent == Intent.GREETING:
            return GREETING_PROMPT
        elif intent in (Intent.ELIGIBILITY, Intent.ELIGIBILITY_REASON):
            return ELIGIBILITY_PROMPT
        elif intent in (Intent.DOCUMENT_STATUS, Intent.DOCUMENT_REMINDER):
            return DOCUMENT_PROMPT
        elif intent == Intent.ACTIVE_SCHEMES:
            return SCHEME_PROMPT
        else:
            # Fallback for unsupported intents or general conversation
            return FALLBACK_PROMPT
