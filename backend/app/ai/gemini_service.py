import os
import logging
import time
from typing import Optional
from google import genai
from google.genai import types
import traceback

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        try:
            self.temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
        except ValueError:
            self.temperature = 0.7
            
        if self.api_key:
            # Clean initialization without custom httpx or timeout configs that might interfere
            self.client = genai.Client(api_key=self.api_key)
            self.model = True
        else:
            self.client = None
            self.model = None
            logger.warning("GEMINI_API_KEY is not set. GeminiService is disabled.")

    def generate_response(self, message: str, system_prompt: Optional[str] = None, context: Optional[str] = None) -> Optional[str]:
        if not self.model:
            logger.error("Model not initialized (missing API key?)")
            raise Exception("GeminiService is not initialized due to missing API key.")

        prompt_lines = []
        if context:
            prompt_lines.append(f"Context:\n{context}\n")
        prompt_lines.append(f"User Message:\n{message}")
        
        prompt = "\n".join(prompt_lines)

        try:
            import importlib.metadata
            sdk_version = importlib.metadata.version('google-genai')
        except Exception:
            sdk_version = 'Unknown'

        # Build config
        config_kwargs = {"temperature": self.temperature}
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
            
        config = types.GenerateContentConfig(**config_kwargs)

        start_time = time.time()
        
        # Detailed debugging logs as requested
        logger.info(f"--- DEBUG: BEFORE GENERATE_CONTENT ---")
        logger.info(f"Timestamp: {start_time}")
        logger.info(f"API key present: {bool(self.api_key)}")
        logger.info(f"SDK version: {sdk_version}")
        logger.info(f"Model name: {self.model_name}")
        logger.info(f"Prompt length: {len(prompt)} characters")
        logger.info(f"Config object: {config}")
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            end_time = time.time()
            logger.info(f"--- GEMINI REQUEST END (Success) ---")
            logger.info(f"Duration: {end_time - start_time:.3f}s")
            
            if response.text:
                return response.text
            else:
                logger.warning("Gemini returned successfully but no text exists.")
                return None
                
        except Exception as e:
            end_time = time.time()
            logger.error(f"--- GEMINI REQUEST END (Failed) ---")
            logger.error(f"Duration: {end_time - start_time:.3f}s")
            logger.error(f"Exception Type: {type(e).__name__}")
            logger.error(f"Exception Message: {str(e)}")
            logger.exception("Complete traceback for Gemini API failure:")
            
            # Temporarily re-raise the exception to expose the root cause, DO NOT swallow
            raise e
