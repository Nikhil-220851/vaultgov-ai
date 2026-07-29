from app.copilot.planner.planner_types import PlannerResult, Intent, PlannerDecision
from app.copilot.planner.entity_extractor import EntityExtractor
from app.copilot.planner.rules import RuleEngine
from typing import Dict, Any

class IntentPlanner:
    def __init__(self):
        self.extractor = EntityExtractor()
        self.rule_engine = RuleEngine()

    def _determine_decision(self, intent: Intent, confidence: float, entities: Dict[str, Any], message: str) -> PlannerDecision:
        message_lower = message.lower()
        
        if "weather" in message_lower:
            return PlannerDecision.OUT_OF_SCOPE
            
        if "joke" in message_lower:
            return PlannerDecision.FALLBACK_TO_CHAT
            
        # Ambiguity check: user says 'licence' but doesn't specify which one
        if "licence" in message_lower and "driving_license" not in entities.get("document_types", []):
            return PlannerDecision.ASK_FOR_CLARIFICATION
            
        if confidence < 0.6:
            return PlannerDecision.FALLBACK_TO_CHAT
            
        return PlannerDecision.CONTINUE

    def plan(self, message: str) -> PlannerResult:
        # 1. Extract entities
        entities = self.extractor.extract(message)
        
        # 2. Evaluate rules deterministically
        intent, confidence, needs, reasoning = self.rule_engine.evaluate(message)
        
        # 3. Determine decision
        decision = self._determine_decision(intent, confidence, entities, message)
        
        # 4. Create the planner result
        return PlannerResult(
            intent=intent,
            confidence=confidence,
            decision=decision,
            entities=entities,
            needs=needs,
            reasoning=reasoning
        )

# Sample Queries for Unit Testing or Demonstration
def get_sample_queries():
    return [
        "Hello there!",
        "What is the status of my passport document?",
        "I need to renew my driving license.",
        "How do I upload a new tax document?",
        "Show me childcare schemes I am eligible for.",
        "Am I entitled to housing assistance?",
        "When is my ID expiring?",
        "Show my profile details.",
        "Help me with this app.",
        "What's the weather like today?", # OUT_OF_SCOPE
        "Tell me a joke.", # FALLBACK_TO_CHAT
        "Show licence." # ASK_FOR_CLARIFICATION
    ]

if __name__ == "__main__":
    planner = IntentPlanner()
    for query in get_sample_queries():
        print(f"Query: {query}")
        res = planner.plan(query)
        print(f"Result: {res.model_dump_json(indent=2)}\n")
