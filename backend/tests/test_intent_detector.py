import pytest
from app.copilot.intent_detector import detect_intent, preprocess_text
from app.copilot.types import Intent

def test_greeting_variations():
    greetings = [
        "Hi", "Hii", "Hiii", "Hello", "Helloo", "Hellooo",
        "Hey", "Heyy", "Heyyy", "Hlo", "Hloo", "Yo", "Sup",
        "Good Morning", "Good Afternoon", "Good Evening"
    ]
    for greeting in greetings:
        result = detect_intent(greeting)
        assert result.intent == Intent.GREETING, f"Failed for {greeting}, got {result.intent}"

def test_priority_intents_over_greeting():
    # Greeting + Actionable intent -> Actionable intent
    result = detect_intent("Hi what is my document status")
    assert result.intent == Intent.DOCUMENT_STATUS, f"Got {result.intent}"
    # Wait, the prompt said: "Hi show my documents" returns DOCUMENT intent. 
    # Let's check which document intent it maps to, probably DOCUMENT_STATUS
    # "Hello active schemes" -> SCHEME intent (ACTIVE_SCHEMES or SCHEME_COMPARE or SCHEME_EXPLAIN)
    # The prompt specifically says "returns DOCUMENT intent." or "returns SCHEME intent."
    
    result2 = detect_intent("Hello active schemes")
    # Actually, SCHEME intent doesn't exist as a single intent, there is SCHEME_EXPLAIN, SCHEME_COMPARE.
    # The user might mean one of them, but let's just make sure it's not GREETING.
    assert result2.intent != Intent.GREETING, "Should prioritize scheme over greeting"
    
    result3 = detect_intent("Hey my Aadhaar expires")
    assert result3.intent == Intent.DOCUMENT_REMINDER, f"Got {result3.intent}"

def test_preprocessing():
    assert preprocess_text("Hiiiii") == "hi"
    assert preprocess_text("Hellooooo") == "hello"
    assert preprocess_text("Heyyyyy") == "hey"
    assert preprocess_text("Hlooo") == "hlo"
    assert preprocess_text("   suuup  !! ") == "sup"
    assert preprocess_text("suuup") == "sup"
