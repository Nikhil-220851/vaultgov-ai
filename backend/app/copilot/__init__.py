"""
copilot/__init__.py

VaultGov Copilot package.

This package provides the backend foundation for the VaultGov Copilot feature.
It exposes a FastAPI router that is registered in app/main.py under /api/copilot.

Submodules
----------
chat        — FastAPI router (POST /chat)
config      — Environment-driven configuration
exceptions  — Domain-specific exception hierarchy
llm_provider — Abstract LLM provider layer + concrete provider stubs
types       — Pydantic request / response models
"""
