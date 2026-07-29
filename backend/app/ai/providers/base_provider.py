from abc import ABC, abstractmethod
from typing import Optional

class AIProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        pass

    @property
    @abstractmethod
    def supports_tools(self) -> bool:
        pass

    @property
    @abstractmethod
    def supports_json(self) -> bool:
        pass

    @abstractmethod
    def generate_response(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Optional[str]:
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass
