import logging
from typing import Optional
from app.ai.providers.base_provider import AIProvider

logger = logging.getLogger(__name__)

class FallbackProvider(AIProvider):
    def __init__(self, primary: AIProvider, fallback: AIProvider):
        self.primary = primary
        self.fallback = fallback

    @property
    def provider_name(self) -> str:
        return f"{self.primary.provider_name}_with_fallback_{self.fallback.provider_name}"

    @property
    def model_name(self) -> str:
        return f"primary: {self.primary.model_name}, fallback: {self.fallback.model_name}"

    @property
    def supports_streaming(self) -> bool:
        return self.primary.supports_streaming or self.fallback.supports_streaming

    @property
    def supports_tools(self) -> bool:
        return self.primary.supports_tools or self.fallback.supports_tools

    @property
    def supports_json(self) -> bool:
        return self.primary.supports_json or self.fallback.supports_json

    def generate_response(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Optional[str]:
        try:
            logger.info(f"Trying primary provider: {self.primary.provider_name}")
            response = self.primary.generate_response(message, system_prompt, context, temperature, max_tokens)
            if response:
                return response
            else:
                logger.warning(f"Primary provider {self.primary.provider_name} returned empty response. Switching to fallback.")
        except Exception as e:
            logger.error(f"Primary provider {self.primary.provider_name} failed: {e}. Switching to fallback {self.fallback.provider_name}.")
            
        # Try fallback
        try:
            logger.info(f"Trying fallback provider: {self.fallback.provider_name}")
            return self.fallback.generate_response(message, system_prompt, context, temperature, max_tokens)
        except Exception as e:
            logger.error(f"Fallback provider {self.fallback.provider_name} also failed: {e}.")
            raise Exception("Both primary and fallback AI providers failed.") from e

    def health_check(self) -> bool:
        return self.primary.health_check() or self.fallback.health_check()
