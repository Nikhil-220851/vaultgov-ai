"""
engines/base.py
===============
Abstract base class that every extraction engine must implement.

Provider-agnostic design
------------------------
The ``DocumentIntelligenceService`` depends only on ``BaseExtractionEngine``.
Swapping OpenAI for Gemini, Claude, or a local model requires only:

1. Implement a new subclass of ``BaseExtractionEngine``.
2. Pass it to ``DocumentIntelligenceService(engine=MyNewEngine())``.

No other file needs to change.

Contract
--------
``extract(prompt)`` receives a plain-text prompt string and returns a Python
``dict`` that the caller (``ResponseParser``) will validate.  The engine is
responsible for:

* Calling the provider API.
* Instructing the provider to return JSON (via ``response_format``, system
  message, or whatever mechanism the provider supports).
* Raising ``ExtractionEngineError`` on any API / network failure.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class BaseExtractionEngine(ABC):
    """
    Abstract extraction engine.

    All concrete engine implementations must inherit from this class and
    implement the ``extract`` coroutine.

    Attributes
    ----------
    provider_name : str
        Human-readable name of the LLM provider (e.g. ``"openai"``).
        Used in logging and error messages.
    """

    #: Subclasses should override this with their provider identifier.
    provider_name: str = "unknown"

    @abstractmethod
    async def extract(self, prompt: str) -> str:
        """
        Send *prompt* to the underlying LLM and return its raw text response.

        The response should be a JSON string (the engine is responsible for
        requesting JSON output from the provider).  It will be decoded and
        validated by ``ResponseParser`` — the engine does not need to
        parse it.

        Parameters
        ----------
        prompt : str
            The fully assembled extraction prompt built by ``PromptBuilder``.

        Returns
        -------
        str
            Raw text response from the LLM.  Expected to be valid JSON but
            may contain markdown fences (``ResponseParser`` strips those).

        Raises
        ------
        ExtractionEngineError
            On any API error, timeout, rate-limit, or unexpected provider
            response.
        """
        ...
