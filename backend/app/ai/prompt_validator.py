import logging

logger = logging.getLogger(__name__)

class PromptValidator:
    """
    Validates prompts before sending to Gemini.
    """
    
    @staticmethod
    def validate(system_prompt: str, context_text: str, max_chars: int = 12000) -> bool:
        if not system_prompt or not system_prompt.strip():
            logger.warning("PromptValidator: Empty system prompt.")
            return False
            
        # Context text might be empty if there are no facts, but normally shouldn't be completely empty for core intents.
        # However, for greeting, it might be.
        
        if len(context_text) > max_chars:
            logger.warning(f"PromptValidator: Context text too long ({len(context_text)} > {max_chars}).")
            return False
            
        return True
