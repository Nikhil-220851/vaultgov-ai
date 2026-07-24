from typing import Any, Dict

class ContextBuilder:
    """
    Converts backend outputs into structured text for Gemini.
    """

    @staticmethod
    def build_context(data: Dict[str, Any], user_question: str) -> str:
        """
        Builds a text context representation of the structured data for Gemini.
        """
        lines = []

        if "conversation_history" in data and data["conversation_history"]:
            lines.append("Conversation History:")
            for turn in data["conversation_history"]:
                role = turn.get("role", "").capitalize()
                msg = turn.get("message", "")
                if msg:
                    lines.append(f"{role}:\n{msg}\n")
            lines.append("")

        if "intent" in data:
            lines.append(f"User Intent:\n{str(data['intent']).capitalize()}\n")

        for key, value in data.items():
            if key in ("intent", "matched_on", "phase", "conversation_history"):
                continue

            formatted_key = key.replace('_', ' ').title()
            
            if not value and value != 0 and value != False:
                continue

            lines.append(f"{formatted_key}:")
            
            if isinstance(value, dict):
                for k, v in value.items():
                    if isinstance(v, list) and v:
                        lines.append(f"- {k.replace('_', ' ').title()}:")
                        for item in v:
                            if isinstance(item, dict):
                                item_str = ", ".join(f"{ik}: {iv}" for ik, iv in item.items() if iv)
                                lines.append(f"  * {item_str}")
                            else:
                                lines.append(f"  * {item}")
                    else:
                        lines.append(f"- {k.replace('_', ' ').title()}: {v}")
            elif isinstance(value, list) and value:
                for item in value:
                    if isinstance(item, dict):
                        item_str = ", ".join(f"{ik}: {iv}" for ik, iv in item.items() if iv)
                        lines.append(f"- {item_str}")
                    else:
                        lines.append(f"- {item}")
            else:
                lines.append(str(value))
                
            lines.append("")

        lines.append(f"User Question:\n{user_question}")
        
        return "\n".join(lines).strip()
