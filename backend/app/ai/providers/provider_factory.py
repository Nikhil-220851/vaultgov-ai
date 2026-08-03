import os
import logging
from typing import Dict
from app.ai.providers.base_provider import AIProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.groq_provider import GroqProvider
from app.ai.providers.fallback_provider import FallbackProvider

logger = logging.getLogger(__name__)

class ProviderFactory:
    _instances: Dict[str, AIProvider] = {}
    
    @classmethod
    def _create_single_provider(cls, name: str) -> AIProvider:
        if name == "gemini":
            return GeminiProvider()
        elif name == "groq":
            return GroqProvider()
        else:
            raise ValueError(f"Unknown AI_PROVIDER: {name}")

    @classmethod
    def get_provider(cls) -> AIProvider:
        # Read providers from environment
        primary_provider_name = os.getenv("AI_PROVIDER", "gemini").lower()
        fallback_provider_name = os.getenv("FALLBACK_PROVIDER", "").lower()
        
        instance_key = f"{primary_provider_name}_{fallback_provider_name}"
        
        if instance_key not in cls._instances:
            primary_provider = cls._create_single_provider(primary_provider_name)
            
            if fallback_provider_name and fallback_provider_name != primary_provider_name:
                fallback_provider = cls._create_single_provider(fallback_provider_name)
                cls._instances[instance_key] = FallbackProvider(primary_provider, fallback_provider)
            else:
                cls._instances[instance_key] = primary_provider
                
        return cls._instances[instance_key]
