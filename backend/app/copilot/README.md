# VaultGov Copilot — Backend Architecture

## Overview

The `app/copilot/` package provides the **foundation layer** for the VaultGov AI Copilot feature.  
It is deliberately minimal: only architecture and contracts are established here. No AI calls are made yet.

---

## File Map

```
app/copilot/
├── __init__.py        Package docstring and re-export control
├── config.py          Environment-variable driven settings (frozen dataclass)
├── exceptions.py      Domain exception hierarchy (CopilotError → subtypes)
├── types.py           Pydantic request / response models (API contract)
├── llm_provider.py    Abstract provider + GeminiProvider stub + factory
├── chat.py            FastAPI router  →  POST /api/copilot/chat
└── README.md          ← you are here
```

---

## API Contract

```
POST /api/copilot/chat
Authorization: Bearer <firebase-id-token>
Content-Type:  application/json

Request
{
  "message": "What schemes am I eligible for?"
}

Response (Phase 1 — placeholder)
{
  "message":    "temporary placeholder",
  "intent":     "unknown",
  "confidence": 0.0,
  "actions":    [],
  "sources":    []
}
```

---

## Environment Variables

| Variable        | Default              | Purpose                                    |
|-----------------|----------------------|--------------------------------------------|
| `GEMINI_API_KEY`| _(empty)_            | Google Gemini API key (required for Phase 2) |
| `LLM_PROVIDER`  | `gemini`             | Active provider: `gemini`                  |
| `DEFAULT_MODEL` | `gemini-1.5-flash`   | Model name forwarded to the provider       |
| `COPILOT_DEBUG` | `false`              | Enable verbose copilot logging             |

---

## Provider Architecture

```
LLMProvider (ABC)
    generate(prompt) → str       ← abstract
    is_available()   → bool      ← abstract

    └── GeminiProvider
            is_available()  → checks GEMINI_API_KEY presence
            generate(...)   → raises NotImplementedError (Phase 1)
```

`get_llm_provider()` is a FastAPI-compatible factory (usable as `Depends`).  
Adding a new provider means:
1. Subclass `LLMProvider`
2. Add it to the `registry` dict in `get_llm_provider()`
3. Set `LLM_PROVIDER=<your_key>` in `.env`

---

## Phased Roadmap

| Phase | Scope                                          | Status      |
|-------|------------------------------------------------|-------------|
| 1     | Foundation: router, types, config, exceptions  | ✅ Complete |
| 2     | Gemini integration + prompt builder            | ⬜ Planned  |
| 3     | Intent detection + eligibility context         | ⬜ Planned  |
| 4     | Memory / session history                       | ⬜ Planned  |
| 5     | Document-aware context (OCR fields)            | ⬜ Planned  |

---

## Design Principles

- **Strict module boundaries** — copilot code never imports from `api/`, `services/`, or `models/` directly. Those dependencies will be injected via FastAPI `Depends`.
- **No side effects at import** — `config.py` reads env vars once; all other modules are pure definitions.
- **Open/Closed** — adding a provider or intent handler extends the system; it does not modify existing files.
