"""
Prompt Manager.
"""
from app.copilot.types import Intent
from app.ai.prompts.base_prompt import COPILOT_SYSTEM_PROMPT

class PromptManager:
    @staticmethod
    def get_prompt(intent: Intent) -> str:
        """
        Returns the unified COPILOT_SYSTEM_PROMPT for all interactions.
        The Copilot reasons over the contextual sections provided instead of 
        using strict intent-specific prompts.
        """
        return COPILOT_SYSTEM_PROMPT
