from typing import List, Dict, Any
from app.copilot.types import Intent
from .suggestion_types import InternalAction

class RecommendationEngine:
    @staticmethod
    def get_recommendations(intent: Intent, metadata: Dict[str, Any], memory: Any = None) -> List[InternalAction]:
        """
        An extension point to append AI-driven or context-aware recommendations.
        Returns an empty list for now.
        """
        return []
