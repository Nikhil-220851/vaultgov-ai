"""
engines/gemini_engine.py
========================
Production-grade extraction engine backed by the Google Gemini API.

Design principles
-----------------
* **Fault-tolerant**: Exponential-backoff retries for transient server errors;
  non-retryable client/auth errors are surfaced immediately.
* **Resilient**: Automatic fallback through an ordered list of Gemini models
  when the primary model is repeatedly unavailable.
* **Observable**: Structured log entries for every significant event — start,
  retry, fallback, success, and failure — including precise timing.
* **Safe**: Every external exception is wrapped in ``ExtractionEngineError``
  before crossing the service boundary. Internal tracebacks are preserved.
* **Configurable**: All tunables (timeouts, retries, models, temperature) are
  driven by environment variables; no magic numbers live in logic.
* **Extensible**: Inherits from ``BaseExtractionEngine``; swap for OpenAI,
  Claude, or Azure by creating a sibling class — nothing else changes.

Environment variables
---------------------
``GEMINI_API_KEY``
    Gemini API key.  **Required.**

``GEMINI_EXTRACTION_MODEL``
    Primary model.  Default: ``gemini-2.5-flash``.

``GEMINI_EXTRACTION_TEMPERATURE``
    Sampling temperature.  Default: ``0.0``.

``GEMINI_REQUEST_TIMEOUT``
    Per-attempt timeout in seconds.  Default: ``30``.

``GEMINI_MAX_RETRIES``
    Maximum retry attempts per model.  Default: ``3``.

``GEMINI_BACKOFF_MULTIPLIER``
    Base multiplier for exponential backoff (seconds).  Default: ``1.0``.

``GEMINI_FALLBACK_MODELS``
    Comma-separated ordered list of fallback models.
    Default: ``gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash``.

Usage
-----
::

    engine = GeminiExtractionEngine()
    raw_json_str = await engine.extract(prompt)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import List, Optional, Tuple

from google import genai
from google.genai import errors as genai_errors
from google.genai.types import GenerateContentConfig

from app.services.document_intelligence.engines.base import BaseExtractionEngine
from app.services.document_intelligence.exceptions import ExtractionEngineError

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Safe defaults (used only when ENV vars are absent)
# ---------------------------------------------------------------------------
_DEFAULT_MODEL: str = "gemini-2.5-flash"
_DEFAULT_TEMPERATURE: float = 0.0
_DEFAULT_TIMEOUT: float = 30.0
_DEFAULT_MAX_RETRIES: int = 3
_DEFAULT_BACKOFF_MULTIPLIER: float = 1.0
_DEFAULT_FALLBACK_MODELS: List[str] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

# HTTP status codes that represent transient server-side failures worth retrying.
_RETRYABLE_HTTP_STATUS_CODES: frozenset = frozenset({429, 500, 502, 503, 504})

# System instruction that locks the model into JSON-only output.
_SYSTEM_INSTRUCTION: str = (
    "You are a JSON extraction engine. "
    "You MUST respond with ONLY a valid JSON object or array. "
    "No markdown fences. No explanations. No text outside the JSON structure."
)


# ---------------------------------------------------------------------------
# Helper: read typed ENV values
# ---------------------------------------------------------------------------

def _env_str(key: str, default: str) -> str:
    """Return the value of *key* from the environment, or *default*."""
    return os.getenv(key, default).strip()


def _env_float(key: str, default: float) -> float:
    """Return *key* as a float from the environment, or *default*."""
    raw = os.getenv(key)
    if raw is None:
        return default
    try:
        return float(raw.strip())
    except ValueError:
        logger.warning(
            "Invalid float for env var %s='%s'. Using default %.2f.",
            key, raw, default,
        )
        return default


def _env_int(key: str, default: int) -> int:
    """Return *key* as an int from the environment, or *default*."""
    raw = os.getenv(key)
    if raw is None:
        return default
    try:
        return int(raw.strip())
    except ValueError:
        logger.warning(
            "Invalid int for env var %s='%s'. Using default %d.",
            key, raw, default,
        )
        return default


def _env_model_list(key: str, default: List[str]) -> List[str]:
    """
    Return a comma-separated list of model names from *key*, or *default*.

    Each entry is stripped of surrounding whitespace; empty strings are
    discarded so ``GEMINI_FALLBACK_MODELS=,gemini-1.5-flash,`` still works.
    """
    raw = os.getenv(key)
    if not raw:
        return default
    models = [m.strip() for m in raw.split(",") if m.strip()]
    return models if models else default


# ---------------------------------------------------------------------------
# Main engine class
# ---------------------------------------------------------------------------

class GeminiExtractionEngine(BaseExtractionEngine):
    """
    Google Gemini-backed extraction engine — production-grade implementation.

    Responsibilities
    ----------------
    * Issue Gemini API requests with a hard per-attempt timeout.
    * Retry on transient errors with exponential backoff.
    * Fall back to alternative models when the primary model is exhausted.
    * Validate every response (non-empty, valid JSON, no markdown).
    * Emit structured log events for observability.
    * Wrap all external exceptions in ``ExtractionEngineError``.

    Parameters
    ----------
    api_key:
        Gemini API key. Falls back to ``GEMINI_API_KEY`` env var.
    model:
        Primary model identifier. Falls back to ``GEMINI_EXTRACTION_MODEL``
        env var, then to ``gemini-2.5-flash``.
    temperature:
        Sampling temperature.  Falls back to ``GEMINI_EXTRACTION_TEMPERATURE``
        env var, then to ``0.0``.
    """

    provider_name: str = "gemini"

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> None:
        # --- credentials -----------------------------------------------
        self._api_key: str = api_key or _env_str("GEMINI_API_KEY", "")

        # --- primary model ---------------------------------------------
        self._primary_model: str = (
            model or _env_str("GEMINI_EXTRACTION_MODEL", _DEFAULT_MODEL)
        )

        # --- generation params -----------------------------------------
        self._temperature: float = (
            temperature
            if temperature is not None
            else _env_float("GEMINI_EXTRACTION_TEMPERATURE", _DEFAULT_TEMPERATURE)
        )

        # --- retry / timeout config ------------------------------------
        self._timeout: float = _env_float("GEMINI_REQUEST_TIMEOUT", _DEFAULT_TIMEOUT)
        self._max_retries: int = _env_int("GEMINI_MAX_RETRIES", _DEFAULT_MAX_RETRIES)
        self._backoff_multiplier: float = _env_float(
            "GEMINI_BACKOFF_MULTIPLIER", _DEFAULT_BACKOFF_MULTIPLIER
        )

        # --- fallback model chain -------------------------------------
        # ENV overrides defaults; primary model is always at index 0
        # (deduplication preserves order).
        raw_fallbacks: List[str] = _env_model_list(
            "GEMINI_FALLBACK_MODELS", _DEFAULT_FALLBACK_MODELS
        )
        self._model_chain: List[str] = self._build_model_chain(
            self._primary_model, raw_fallbacks
        )

        # --- Gemini client (singleton per engine instance) -------------
        if not self._api_key:
            logger.warning(
                "GEMINI_API_KEY is not set. "
                "GeminiExtractionEngine will raise ExtractionEngineError on first call."
            )
            self._client: Optional[genai.Client] = None
        else:
            # Client is created once and reused for all requests to avoid
            # unnecessary object churn and connection overhead.
            self._client = genai.Client(api_key=self._api_key)

        logger.info(
            "GeminiExtractionEngine initialised. "
            "primary_model=%s temperature=%.2f timeout=%.1fs "
            "max_retries=%d backoff_multiplier=%.2f model_chain=%s",
            self._primary_model,
            self._temperature,
            self._timeout,
            self._max_retries,
            self._backoff_multiplier,
            self._model_chain,
        )

    # ------------------------------------------------------------------
    # Public API  (unchanged — preserves backward compatibility)
    # ------------------------------------------------------------------

    async def extract(self, prompt: str) -> str:
        """
        Send *prompt* to the Gemini API and return the raw JSON string.

        The method iterates through the model chain (primary → fallbacks).
        Within each model it retries up to ``_max_retries`` times on transient
        errors before advancing to the next model.  A hard per-attempt timeout
        is enforced via ``asyncio.wait_for``.

        Parameters
        ----------
        prompt : str
            Fully assembled extraction prompt from ``PromptBuilder``.

        Returns
        -------
        str
            Validated JSON string from the LLM.

        Raises
        ------
        ExtractionEngineError
            On any unrecoverable failure: auth errors, exhausted retries,
            exhausted model chain, invalid JSON response, or timeout.
        """
        if self._client is None:
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    "GEMINI_API_KEY is not configured. "
                    "Set the environment variable and restart the service."
                ),
            )

        start_time: float = time.monotonic()
        logger.info(
            "[Gemini] Extraction started. "
            "model_chain=%s prompt_length=%d timeout=%.1fs",
            self._model_chain,
            len(prompt),
            self._timeout,
        )

        last_error: Optional[ExtractionEngineError] = None

        for model_index, model_name in enumerate(self._model_chain):
            is_fallback: bool = model_index > 0
            if is_fallback:
                elapsed: float = time.monotonic() - start_time
                logger.warning(
                    "[Gemini] Fallback to %s. "
                    "fallback_index=%d elapsed=%.2fs reason=%s",
                    model_name,
                    model_index,
                    elapsed,
                    str(last_error),
                )

            result, last_error = await self._try_model(
                model_name=model_name,
                prompt=prompt,
                start_time=start_time,
            )
            if result is not None:
                return result

            # Auth / permission errors will fail identically on every model —
            # skip the fallback chain and surface the error immediately.
            if last_error is not None and self._is_auth_or_client_error(last_error):
                logger.error(
                    "[Gemini] Non-retryable error — skipping fallback chain. "
                    "error=%s",
                    str(last_error),
                )
                raise last_error

        # All models exhausted
        total_elapsed: float = time.monotonic() - start_time
        logger.error(
            "[Gemini] Extraction failed. All models in chain exhausted. "
            "total_elapsed=%.2fs last_error=%s",
            total_elapsed,
            str(last_error),
        )
        raise last_error or ExtractionEngineError(
            provider=self.provider_name,
            detail="All models in the fallback chain failed with unknown errors.",
        )

    # ------------------------------------------------------------------
    # Private — model-level orchestration
    # ------------------------------------------------------------------

    async def _try_model(
        self,
        model_name: str,
        prompt: str,
        start_time: float,
    ) -> Tuple[Optional[str], Optional[ExtractionEngineError]]:
        """
        Attempt extraction with *model_name*, retrying on transient errors.

        Returns
        -------
        Tuple[Optional[str], Optional[ExtractionEngineError]]
            ``(result, None)`` on success.
            ``(None, error)`` when all retries are exhausted or a
            non-retryable error is encountered.
        """
        last_error: Optional[ExtractionEngineError] = None

        for attempt in range(1, self._max_retries + 1):
            attempt_start: float = time.monotonic()

            if attempt > 1:
                backoff_seconds: float = self._calculate_backoff(attempt)
                logger.warning(
                    "[Gemini] Retry #%d/%d. model=%s backoff=%.1fs reason=%s",
                    attempt,
                    self._max_retries,
                    model_name,
                    backoff_seconds,
                    str(last_error),
                )
                await asyncio.sleep(backoff_seconds)

            logger.info(
                "[Gemini] Request started. model=%s attempt=%d/%d",
                model_name,
                attempt,
                self._max_retries,
            )

            try:
                raw_text: str = await self._make_request(model_name, prompt)
                validated_text: str = self._validate_response(raw_text, model_name)

                attempt_elapsed: float = time.monotonic() - attempt_start
                total_elapsed: float = time.monotonic() - start_time
                logger.info(
                    "[Gemini] Success. model=%s attempt=%d "
                    "response_length=%d gemini_latency=%.2fs total_elapsed=%.2fs",
                    model_name,
                    attempt,
                    len(validated_text),
                    attempt_elapsed,
                    total_elapsed,
                )
                return validated_text, None

            except ExtractionEngineError as engine_err:
                last_error = engine_err
                attempt_elapsed = time.monotonic() - attempt_start

                if not self._is_retryable(engine_err):
                    logger.error(
                        "[Gemini] Non-retryable error on attempt %d/%d. "
                        "model=%s latency=%.2fs error=%s",
                        attempt,
                        self._max_retries,
                        model_name,
                        attempt_elapsed,
                        str(engine_err),
                    )
                    return None, engine_err

                logger.warning(
                    "[Gemini] Retryable error on attempt %d/%d. "
                    "model=%s latency=%.2fs error=%s",
                    attempt,
                    self._max_retries,
                    model_name,
                    attempt_elapsed,
                    str(engine_err),
                )

        # All attempts for this model exhausted
        logger.error(
            "[Gemini] All %d attempts exhausted for model=%s. last_error=%s",
            self._max_retries,
            model_name,
            str(last_error),
        )
        return None, last_error

    # ------------------------------------------------------------------
    # Private — single API request with timeout
    # ------------------------------------------------------------------

    async def _make_request(self, model_name: str, prompt: str) -> str:
        """
        Issue a single Gemini API request and return the raw response text.

        Wraps the call with ``asyncio.wait_for`` to enforce ``_timeout``.
        All SDK exceptions are classified and re-raised as
        ``ExtractionEngineError``.

        Parameters
        ----------
        model_name : str
            Gemini model identifier to use for this request.
        prompt : str
            Full extraction prompt.

        Returns
        -------
        str
            Raw text from the Gemini response.

        Raises
        ------
        ExtractionEngineError
            Classified error (timeout, auth, server, client, connection, or
            unexpected).
        """
        try:
            coroutine = self._client.aio.models.generate_content(  # type: ignore[union-attr]
                model=model_name,
                contents=prompt,
                config=GenerateContentConfig(
                    system_instruction=_SYSTEM_INSTRUCTION,
                    temperature=self._temperature,
                    response_mime_type="application/json",
                ),
            )
            response = await asyncio.wait_for(coroutine, timeout=self._timeout)

        except asyncio.TimeoutError as exc:
            logger.warning(
                "[Gemini] Timeout after %.1fs. model=%s",
                self._timeout,
                model_name,
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Request to model '{model_name}' timed out after "
                    f"{self._timeout:.0f}s. The service may be overloaded."
                ),
            ) from exc

        except genai_errors.APIError as exc:
            raise self._classify_api_error(exc, model_name) from exc

        except (ConnectionError, OSError) as exc:
            # Covers DNS failures, connection resets, and socket-level errors.
            logger.warning(
                "[Gemini] Network error. model=%s error=%s", model_name, str(exc)
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Network error while contacting model '{model_name}': {exc}",
            ) from exc

        except Exception as exc:
            logger.exception(
                "[Gemini] Unexpected error during API call. model=%s", model_name
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Unexpected error with model '{model_name}': {exc}",
            ) from exc

        return self._parse_response(response, model_name)

    # ------------------------------------------------------------------
    # Private — response text extraction
    # ------------------------------------------------------------------

    def _parse_response(self, response: object, model_name: str) -> str:
        """
        Extract the raw text string from a Gemini SDK response object.

        Parameters
        ----------
        response : object
            The ``GenerateContentResponse`` returned by the SDK.
        model_name : str
            Model name used for error context.

        Returns
        -------
        str
            The ``response.text`` value.

        Raises
        ------
        ExtractionEngineError
            If ``response.text`` is missing or ``None``.
        """
        raw_text: Optional[str] = getattr(response, "text", None)
        if raw_text is None:
            logger.error(
                "[Gemini] Response has no 'text' attribute. model=%s", model_name
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Model '{model_name}' returned a response with no text content. "
                    "The model may have been blocked by safety filters."
                ),
            )
        return raw_text

    # ------------------------------------------------------------------
    # Private — response validation
    # ------------------------------------------------------------------

    def _validate_response(self, raw_text: str, model_name: str) -> str:
        """
        Validate that *raw_text* is a non-empty, structurally valid JSON string.

        Checks performed (in order):
        1. Text is not blank / whitespace-only.
        2. Text does not contain markdown code fences.
        3. Text parses as valid JSON.

        Parameters
        ----------
        raw_text : str
            Text as received from ``_parse_response``.
        model_name : str
            Model name used for error context.

        Returns
        -------
        str
            *raw_text* unchanged (downstream ``ResponseParser`` handles trimming).

        Raises
        ------
        ExtractionEngineError
            If any validation check fails.
        """
        stripped: str = raw_text.strip()

        # 1. Blank response
        if not stripped:
            logger.error("[Gemini] Empty response body. model=%s", model_name)
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Model '{model_name}' returned an empty response.",
            )

        # 2. Markdown fence detection (e.g., ```json ... ```)
        if stripped.startswith("```"):
            logger.error(
                "[Gemini] Response contains markdown fences — rejecting. model=%s",
                model_name,
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Model '{model_name}' returned a markdown-wrapped response. "
                    "Expected raw JSON only."
                ),
            )

        # 3. JSON parse validation
        try:
            json.loads(stripped)
        except json.JSONDecodeError as exc:
            logger.error(
                "[Gemini] Response is not valid JSON. model=%s "
                "parse_error=%s response_preview=%.120s",
                model_name,
                str(exc),
                stripped,
            )
            raise ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Model '{model_name}' returned invalid JSON: {exc}. "
                    f"Response preview: {stripped[:120]!r}"
                ),
            ) from exc

        return raw_text

    # ------------------------------------------------------------------
    # Private — error classification
    # ------------------------------------------------------------------

    def _classify_api_error(
        self, exc: genai_errors.APIError, model_name: str
    ) -> ExtractionEngineError:
        """
        Map a ``google.genai.errors.APIError`` to an ``ExtractionEngineError``
        with a meaningful, production-safe message.

        Parameters
        ----------
        exc : genai_errors.APIError
            The raw SDK exception.
        model_name : str
            Model name used for error context.

        Returns
        -------
        ExtractionEngineError
            Classified and human-readable engine error.
        """
        status_code: int = getattr(exc, "code", 0) or 0
        message: str = str(exc)

        # Authentication / permission — never retry, never fallback
        if isinstance(exc, genai_errors.ClientError) and status_code in (401, 403):
            logger.error(
                "[Gemini] Authentication error. model=%s status=%d",
                model_name, status_code,
            )
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Authentication failed for model '{model_name}' "
                    f"(HTTP {status_code}). Verify GEMINI_API_KEY is valid."
                ),
            )

        # Invalid request — never retry
        if isinstance(exc, genai_errors.ClientError) and status_code == 400:
            logger.error(
                "[Gemini] Invalid request (HTTP 400). model=%s message=%s",
                model_name, message,
            )
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Invalid request to model '{model_name}' (HTTP 400): {message}",
            )

        # Model not found — never retry
        if isinstance(exc, genai_errors.ClientError) and status_code == 404:
            logger.error("[Gemini] Model not found (HTTP 404). model=%s", model_name)
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Model '{model_name}' was not found (HTTP 404). "
                    "Check GEMINI_EXTRACTION_MODEL or GEMINI_FALLBACK_MODELS."
                ),
            )

        # Rate limit — retryable
        if status_code == 429:
            logger.warning("[Gemini] Rate limited (HTTP 429). model=%s", model_name)
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Rate limit exceeded for model '{model_name}' (HTTP 429).",
            )

        # Server errors — retryable
        if status_code in _RETRYABLE_HTTP_STATUS_CODES:
            logger.warning(
                "[Gemini] Server error (HTTP %d). model=%s", status_code, model_name
            )
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Server error from model '{model_name}' "
                    f"(HTTP {status_code}): {message}"
                ),
            )

        # Generic ClientError — not retryable
        if isinstance(exc, genai_errors.ClientError):
            logger.error(
                "[Gemini] Client error (HTTP %d). model=%s message=%s",
                status_code, model_name, message,
            )
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=(
                    f"Client error from model '{model_name}' "
                    f"(HTTP {status_code}): {message}"
                ),
            )

        # Generic ServerError — retryable
        if isinstance(exc, genai_errors.ServerError):
            logger.warning(
                "[Gemini] ServerError. model=%s message=%s", model_name, message
            )
            return ExtractionEngineError(
                provider=self.provider_name,
                detail=f"Server error from model '{model_name}': {message}",
            )

        # Catch-all for any other APIError subclass
        logger.error(
            "[Gemini] Unclassified API error. model=%s type=%s message=%s",
            model_name, type(exc).__name__, message,
        )
        return ExtractionEngineError(
            provider=self.provider_name,
            detail=f"API error from model '{model_name}': {message}",
        )

    # ------------------------------------------------------------------
    # Private — retry / fallback decisions
    # ------------------------------------------------------------------

    def _is_retryable(self, error: ExtractionEngineError) -> bool:
        """
        Return ``True`` if *error* represents a transient failure worth retrying.

        The heuristic inspects the ``detail`` string for HTTP status codes and
        known retryable keywords, since ``ExtractionEngineError`` does not carry
        a structured status code field.

        Retryable
        ---------
        HTTP 429, 500, 502, 503, 504; timeouts; network/connection errors.

        Non-retryable
        -------------
        HTTP 400, 401, 403, 404; authentication failures; invalid model or prompt.

        Parameters
        ----------
        error : ExtractionEngineError

        Returns
        -------
        bool
        """
        detail_lower: str = error.args[0].lower() if error.args else ""

        # Non-retryable signals take precedence
        non_retryable_signals: Tuple[str, ...] = (
            "http 400",
            "http 401",
            "http 403",
            "http 404",
            "authentication failed",
            "invalid request",
            "not found",
            "permission",
            "invalid api",
        )
        for signal in non_retryable_signals:
            if signal in detail_lower:
                return False

        # Retryable signals
        retryable_signals: Tuple[str, ...] = (
            "http 429",
            "http 500",
            "http 502",
            "http 503",
            "http 504",
            "rate limit",
            "timed out",
            "timeout",
            "server error",
            "network error",
            "connection",
        )
        for signal in retryable_signals:
            if signal in detail_lower:
                return True

        # Unknown errors: fail fast — safer than risk of infinite retries
        return False

    def _is_auth_or_client_error(self, error: ExtractionEngineError) -> bool:
        """
        Return ``True`` if *error* is an auth/permission failure that would
        recur identically across every model in the fallback chain.

        Parameters
        ----------
        error : ExtractionEngineError

        Returns
        -------
        bool
        """
        detail_lower: str = error.args[0].lower() if error.args else ""
        halt_signals: Tuple[str, ...] = (
            "http 401",
            "http 403",
            "authentication failed",
            "permission",
            "invalid api",
        )
        return any(signal in detail_lower for signal in halt_signals)

    # ------------------------------------------------------------------
    # Private — utilities
    # ------------------------------------------------------------------

    def _calculate_backoff(self, attempt: int) -> float:
        """
        Return the delay in seconds before the given *attempt* (1-indexed).

        Formula: ``backoff_multiplier * 2^(attempt - 2)``

        Examples (with default multiplier = 1.0)
        -----------------------------------------
        * Attempt 2 → 1.0 s
        * Attempt 3 → 2.0 s
        * Attempt 4 → 4.0 s

        Parameters
        ----------
        attempt : int
            Current 1-indexed attempt number (must be >= 2).

        Returns
        -------
        float
            Backoff duration in seconds.
        """
        return self._backoff_multiplier * (2 ** (attempt - 2))

    @staticmethod
    def _build_model_chain(primary: str, fallbacks: List[str]) -> List[str]:
        """
        Build a deduplicated, ordered model chain beginning with *primary*.

        The primary model is always first.  Fallbacks are appended in order,
        skipping any entry that duplicates the primary to avoid redundant calls.

        Parameters
        ----------
        primary : str
            Primary model name.
        fallbacks : List[str]
            Ordered fallback model names.

        Returns
        -------
        List[str]
            Deduplicated chain, e.g.
            ``['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']``.
        """
        seen: set = {primary}
        chain: List[str] = [primary]
        for model in fallbacks:
            if model not in seen:
                seen.add(model)
                chain.append(model)
        return chain
