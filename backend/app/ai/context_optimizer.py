import os
from typing import Dict, Any

class ContextOptimizer:
    """
    Optimizes the context dictionary before it is sent to the Context Builder.
    """
    
    @staticmethod
    def optimize(context_dict: Dict[str, Any]) -> Dict[str, Any]:
        enable_optimizer = os.getenv("AI_ENABLE_CONTEXT_OPTIMIZER", "true").lower() == "true"
        if not enable_optimizer:
            return context_dict
            
        optimized = {}
        for key, value in context_dict.items():
            # Remove null values or empty lists/dicts
            if value is None:
                continue
            if isinstance(value, (list, dict)) and not value:
                continue
                
            optimized[key] = value
            
        # The conversation history is already trimmed by the MemoryManager using AI_MAX_HISTORY.
        # But we can also do extra trimming if needed.
        if "conversation_history" in optimized:
            max_history = int(os.getenv("AI_MAX_HISTORY", "10"))
            if isinstance(optimized["conversation_history"], list):
                optimized["conversation_history"] = optimized["conversation_history"][-max_history:]
            
        return optimized
