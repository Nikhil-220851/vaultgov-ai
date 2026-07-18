"""
llm_provider.py — Abstract LLM provider layer for VaultGov Copilot.

Architecture
------------
LLMProvider (ABC)          ← defines the interface every provider must implement
    └── GeminiProvider     ← Google Gemini placeholder (no API calls yet)

Why an abstraction?
    Decouples the chat router from any specific AI vendor.
    Swapping from Gemini to OpenAI (or a mock for tests) requires only:
      1. Subclassing LLMProvider
      2. Returning the new concrete class from get_llm_provider()

Current State
-------------
GeminiProvider is a STUB. It does NOT make any network calls and does NOT
require a Gemini API key. It raises NotImplementedError for generate() to
make the "not implemented yet" boundary explicit.

Future Integration Points (NOT implemented here)
-------------------------------------------------
- google-generativeai SDK (pip install google-generativeai)
- Prompt construction (see: copilot/prompt_builder.py — to be created)
- Context injection (see: copilot/context_builder.py — to be created)
- Response parsing into ChatResponse fields
"""

from abc import ABC, abstractmethod
from typing import Any

from app.copilot.config import CopilotSettings, settings as default_settings
from app.copilot.exceptions import CopilotConfigError, LLMUnavailableError


# ── Abstract interface ────────────────────────────────────────────────────────


class LLMProvider(ABC):
    """
    Abstract base class every LLM provider must implement.

    Providers receive the active CopilotSettings at construction so they
    can read api keys, model names, and other vendor-specific config
    without touching global state.
    """

    def __init__(self, config: CopilotSettings) -> None:
        self._config = config

    @property
    def provider_name(self) -> str:
        """Human-readable provider identifier (e.g. 'gemini', 'openai')."""
        return self.__class__.__name__

    @abstractmethod
    def generate(self, prompt: str, **kwargs: Any) -> str:
        """
        Send a prompt to the LLM and return the raw text response.

        Parameters
        ----------
        prompt : str
            The fully-constructed prompt string.
        **kwargs : Any
            Provider-specific options (temperature, max_tokens, …).

        Returns
        -------
        str
            Raw text response from the model.

        Raises
        ------
        LLMUnavailableError
            If the provider is unreachable, rate-limited, or misconfigured.
        LLMResponseParseError
            If the response cannot be interpreted.
        """

    @abstractmethod
    def is_available(self) -> bool:
        """
        Return True if this provider is properly configured and ready.

        Does NOT make a network call — only checks local preconditions
        (e.g. API key presence, SDK import availability).
        """


# ── Concrete providers ────────────────────────────────────────────────────────


class GeminiProvider(LLMProvider):
    """
    Google Gemini provider — PLACEHOLDER ONLY.

    This class establishes the correct interface and configuration wiring
    for the Gemini SDK. No network calls are made and no API key is required
    until generate() is actually invoked (which raises NotImplementedError).

    Next Steps (when ready to integrate Gemini)
    -------------------------------------------
    1.  pip install google-generativeai
    2.  Add GEMINI_API_KEY to backend/.env
    3.  Implement generate() using:
            import google.generativeai as genai
            genai.configure(api_key=self._config.gemini_api_key)
            model = genai.GenerativeModel(self._config.default_model)
            response = model.generate_content(prompt)
            return response.text
    """

    def is_available(self) -> bool:
        """
        Returns True only if a non-empty Gemini API key is configured.
        Does NOT attempt a network request.
        """
        return self._config.has_gemini_key

    def generate(self, prompt: str, **kwargs: Any) -> str:
        """
        NOT YET IMPLEMENTED.

        Will call the Gemini API once the SDK and credentials are wired in.
        Currently raises NotImplementedError to make the boundary explicit.
        """
        if not self.is_available():
            raise LLMUnavailableError(
                provider="gemini",
                reason="GEMINI_API_KEY is not set in the environment.",
            )
        # TODO: Implement Gemini API call
        raise NotImplementedError(
            "GeminiProvider.generate() is not implemented yet. "
            "Set GEMINI_API_KEY and implement the Gemini SDK call."
        )


# ── Provider factory ──────────────────────────────────────────────────────────


def get_llm_provider() -> LLMProvider:
    """
    FastAPI-compatible factory / dependency that returns the active provider.

    Selects the concrete implementation based on config.llm_provider.
    Raises CopilotConfigError for unknown provider values so misconfigurations
    surface at startup rather than silently at runtime.

    Returns
    -------
    LLMProvider
        The active provider instance.

    Raises
    ------
    CopilotConfigError
        If LLM_PROVIDER refers to an unknown backend.
    """
    config = default_settings
    registry: dict[str, type[LLMProvider]] = {
        "gemini": GeminiProvider,
    }

    provider_cls = registry.get(config.llm_provider)
    if provider_cls is None:
        raise CopilotConfigError(
            f"Unknown LLM_PROVIDER '{config.llm_provider}'. "
            f"Valid options: {sorted(registry.keys())}"
        )

    return provider_cls(config)
