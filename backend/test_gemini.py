import os
import time
from google import genai
import google.genai as genai_module
from dotenv import load_dotenv

load_dotenv(".env")

api_key = os.getenv("GEMINI_API_KEY")
model_name = "gemini-2.0-flash"

print(f"API Key present: {bool(api_key)}")
try:
    import importlib.metadata
    sdk_version = importlib.metadata.version('google-genai')
except Exception:
    sdk_version = 'Unknown'
print(f"SDK Version: {sdk_version}")
print(f"Model: {model_name}")

client = genai.Client(api_key=api_key)

print("Sending request to Gemini...")
start_time = time.time()

try:
    response = client.models.generate_content(
        model=model_name,
        contents="Hello"
    )
    print(f"Request successful in {time.time() - start_time:.2f}s")
    print(f"Response: {response.text}")
except Exception as e:
    import traceback
    traceback.print_exc()
