import os
import logging
from typing import Dict
from app.ai.providers.base_provider import AIProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

class ProviderFactory:
    _instances: Dict[str, AIProvider] = {}
    
    @classmethod
    def get_provider(cls) -> AIProvider:
        # Read providers from environment
        primary_provider_name = os.getenv("AI_PROVIDER", "gemini").lower()
        fallback_provider_name = os.getenv("FALLBACK_PROVIDER", "").lower()
        
        # NOTE: Architecture prepared for fallback handling.
        # Fallback logic is not yet implemented per requirements.
        
        if primary_provider_name not in cls._instances:
            if primary_provider_name == "gemini":
                cls._instances[primary_provider_name] = GeminiProvider()
            elif primary_provider_name == "groq":
                cls._instances[primary_provider_name] = GroqProvider()
            else:
                raise ValueError(f"Unknown AI_PROVIDER: {primary_provider_name}")
                
        return cls._instances[primary_provider_name]
