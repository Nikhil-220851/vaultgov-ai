import os
import logging
import time
from typing import Optional
from google import genai
from google.genai import types
from google.api_core.exceptions import GoogleAPIError

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        # Defaults to a lightweight model if not specified
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        try:
            self.temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
        except ValueError:
            self.temperature = 0.7
            
        if self.api_key:
            # We must set http_options timeout so the AI model call does not block indefinitely
            timeout = int(os.getenv("AI_RESPONSE_TIMEOUT", "30"))
            self.client = genai.Client(
                api_key=self.api_key,
                http_options={'timeout': timeout}
            )
            self.model = True
        else:
            self.client = None
            self.model = None
            logger.warning("GEMINI_API_KEY is not set. GeminiService is disabled.")

    def generate_response(self, message: str, system_prompt: Optional[str] = None, context: Optional[str] = None) -> Optional[str]:
        """
        Sends a prompt to Gemini and returns the natural language response.
        Handles API failures and timeouts gracefully by returning None.
        """
        if not self.model:
            return None

        start_time = time.time()
        timeout = int(os.getenv("AI_RESPONSE_TIMEOUT", "30"))
        
        prompt_lines = []
        if context:
            prompt_lines.append(f"Context:\n{context}\n")
        prompt_lines.append(f"User Message:\n{message}")
        
        prompt = "\n".join(prompt_lines)

        try:
            config = types.GenerateContentConfig(
                temperature=self.temperature
            )
            if system_prompt:
                config.system_instruction = system_prompt

            # We don't have an explicit timeout in the GenAI SDK, but typically the underlying client handles timeouts if configured.
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            if response.text:
                return response.text
            else:
                return None
                
        except GoogleAPIError:
            return None
        except Exception:
            return None
