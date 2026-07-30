from typing import Dict, Any, List
from app.copilot.types import Intent
from .card_types import CopilotCard
from .card_registry import get_registry

class CardBuilder:
    @staticmethod
    def build(intent: Intent, metadata: Dict[str, Any]) -> List[CopilotCard]:
        """
        Build a list of UI cards based on the resolved intent and metadata.
        """
        if not metadata:
            return []
            
        registry = get_registry()
        
        builder_func = registry.get(intent)
        if builder_func:
            return builder_func(metadata)
            
        return []
