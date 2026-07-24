"""
scheme_registry.py — JSON-driven scheme registry loader.

Discovers all *.json files in the backend/app/schemes/ directory and
deserialises them into SchemeDefinition objects. Adding a new scheme
requires only dropping a new JSON file — zero code changes required.
"""

import json
import os
from pathlib import Path
from typing import Dict, List

from .models import SchemeDefinition


# Path to the JSON scheme registry — relative to this file
_SCHEMES_DIR = Path(__file__).parent.parent.parent / "schemes"


class SchemeRegistry:
    """
    Loads and caches all scheme definitions from JSON files.

    The registry is loaded once per process startup (lazy singleton).
    It maps scheme_id → SchemeDefinition.
    """

    def __init__(self, schemes_dir: Path = _SCHEMES_DIR) -> None:
        self._schemes_dir = schemes_dir
        self._registry: Dict[str, SchemeDefinition] = {}
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:
            return

        if not self._schemes_dir.exists():
            print(f"[SchemeRegistry] WARNING: Schemes directory not found at {self._schemes_dir}")
            self._loaded = True
            return

        for filepath in sorted(self._schemes_dir.glob("*.json")):
            try:
                with open(filepath, "r", encoding="utf-8") as fh:
                    raw = json.load(fh)
                scheme = SchemeDefinition(**raw)
                self._registry[scheme.scheme_id] = scheme
                print(f"[SchemeRegistry] Loaded scheme: {scheme.scheme_id} ({scheme.display_name})")
            except Exception as exc:
                print(f"[SchemeRegistry] ERROR loading {filepath.name}: {exc}")

        print(f"[SchemeRegistry] Total schemes loaded: {len(self._registry)}")
        self._loaded = True

    def get_all(self) -> List[SchemeDefinition]:
        """Return all registered schemes, sorted by priority asc."""
        self._load()
        return sorted(self._registry.values(), key=lambda s: s.priority)

    def get(self, scheme_id: str) -> SchemeDefinition | None:
        """Return a single scheme by ID."""
        self._load()
        return self._registry.get(scheme_id)

    def list_ids(self) -> List[str]:
        """Return all registered scheme IDs."""
        self._load()
        return list(self._registry.keys())


# Process-level singleton
scheme_registry = SchemeRegistry()
