"""
config.py — VaultGov Copilot configuration.

Reads LLM-related settings from environment variables and exposes them
through a single `CopilotSettings` instance (created once at import time).

Environment Variables
---------------------
GEMINI_API_KEY   — API key for Google Gemini (empty → Gemini calls will fail gracefully).
LLM_PROVIDER     — Which provider to use: "gemini" | "openai" | "mock"  (default: "gemini")
DEFAULT_MODEL    — Model name forwarded to the active provider             (default: "gemini-1.5-flash")
COPILOT_DEBUG    — Set to "true" to enable verbose copilot logging         (default: "false")
"""

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class CopilotSettings:
    """Immutable snapshot of copilot configuration read at startup."""

    gemini_api_key: str = field(default="")
    llm_provider: str = field(default="gemini")
    default_model: str = field(default="gemini-1.5-flash")
    debug: bool = field(default=False)

    @classmethod
    def from_env(cls) -> "CopilotSettings":
        """Read settings from the process environment."""
        return cls(
            gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
            llm_provider=os.getenv("LLM_PROVIDER", "gemini").lower().strip(),
            default_model=os.getenv("DEFAULT_MODEL", "gemini-1.5-flash").strip(),
            debug=os.getenv("COPILOT_DEBUG", "false").lower() == "true",
        )

    @property
    def has_gemini_key(self) -> bool:
        """True when a non-empty Gemini API key is present."""
        return bool(self.gemini_api_key)


# ── Singleton loaded once at module import ────────────────────────────────────
settings: CopilotSettings = CopilotSettings.from_env()
