import os
import logging
import time
from typing import Optional
from groq import Groq
from app.ai.providers.base_provider import AIProvider

logger = logging.getLogger(__name__)

class GroqProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self._model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        try:
            self._temperature = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
        except ValueError:
            self._temperature = 0.7
            
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY is not set. GroqProvider is disabled.")

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_tools(self) -> bool:
        return True

    @property
    def supports_json(self) -> bool:
        return True

    def generate_response(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        context: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Optional[str]:
        if not self.client:
            logger.error("Model not initialized (missing API key?)")
            raise Exception("GroqProvider is not initialized due to missing API key.")

        prompt_lines = []
        if context:
            prompt_lines.append(f"Context:\n{context}\n")
        prompt_lines.append(f"User Message:\n{message}")
        
        prompt = "\n".join(prompt_lines)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        messages.append({"role": "user", "content": prompt})

        final_temp = temperature if temperature is not None else self._temperature
        
        kwargs = {
            "model": self._model_name,
            "messages": messages,
            "temperature": final_temp,
        }
        
        if max_tokens is not None:
            # using 'max_completion_tokens' for newer groq sdk logic, or 'max_tokens'
            # 'max_tokens' is standard for chat completion parameters.
            kwargs["max_tokens"] = max_tokens

        start_time = time.time()
        
        logger.info(f"--- DEBUG: BEFORE GENERATE_CONTENT (GROQ) ---")
        logger.info(f"Timestamp: {start_time}")
        logger.info(f"Model name: {self._model_name}")
        logger.info(f"Prompt length: {len(prompt)} characters")
        
        try:
            response = self.client.chat.completions.create(**kwargs)
            
            end_time = time.time()
            logger.info(f"--- GROQ REQUEST END (Success) ---")
            logger.info(f"Duration: {end_time - start_time:.3f}s")
            
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
            else:
                logger.warning("Groq returned successfully but no text exists.")
                return None
                
        except Exception as e:
            end_time = time.time()
            logger.error(f"--- GROQ REQUEST END (Failed) ---")
            logger.error(f"Duration: {end_time - start_time:.3f}s")
            logger.error(f"Exception Type: {type(e).__name__}")
            logger.error(f"Exception Message: {str(e)}")
            logger.exception("Complete traceback for Groq API failure:")
            
            raise e

    def health_check(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.models.list()
            return True
        except Exception:
            return False
