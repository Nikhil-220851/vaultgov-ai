"""
exceptions.py — VaultGov Copilot exception hierarchy.

All copilot-specific errors derive from CopilotError so callers can
catch the entire domain with a single except clause when needed.

Hierarchy
---------
CopilotError                       ← base
├── LLMProviderError               ← provider-level failures
│   ├── LLMUnavailableError        ← provider unreachable / quota exceeded
│   └── LLMResponseParseError      ← response could not be parsed
├── CopilotConfigError             ← misconfiguration (e.g. missing API key)
└── CopilotRequestError            ← invalid or malformed request from caller
"""


class CopilotError(Exception):
    """Base class for all VaultGov Copilot exceptions."""

    def __init__(self, message: str = "An unexpected copilot error occurred.") -> None:
        super().__init__(message)
        self.message = message


# ── LLM Provider Errors ───────────────────────────────────────────────────────


class LLMProviderError(CopilotError):
    """Raised when the LLM provider encounters any error."""


class LLMUnavailableError(LLMProviderError):
    """
    Raised when the LLM provider is unreachable, rate-limited,
    or has exhausted its quota.
    """

    def __init__(self, provider: str, reason: str = "") -> None:
        detail = f"LLM provider '{provider}' is unavailable."
        if reason:
            detail += f" Reason: {reason}"
        super().__init__(detail)
        self.provider = provider
        self.reason = reason


class LLMResponseParseError(LLMProviderError):
    """Raised when the LLM response cannot be parsed into the expected format."""

    def __init__(self, raw_response: str = "") -> None:
        super().__init__("Failed to parse LLM response.")
        self.raw_response = raw_response


# ── Configuration Errors ──────────────────────────────────────────────────────


class CopilotConfigError(CopilotError):
    """Raised on copilot misconfiguration (e.g. missing or invalid env vars)."""


# ── Request Errors ────────────────────────────────────────────────────────────


class CopilotRequestError(CopilotError):
    """Raised when the incoming request is invalid or cannot be processed."""
