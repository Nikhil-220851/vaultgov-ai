"""
intent_detector.py — Lightweight keyword/pattern-based intent detection.

Design
------
Detection is purely local — no network calls, no database queries, no AI.
It uses two techniques in sequence:

  1. Advanced Greeting Detection
     Checks for specific conversational greetings. If found, it remembers it but 
     continues evaluating actionable intents so that things like "Hi, show my Aadhaar"
     route to the correct intent instead of overriding.

  2. Priority pattern matching  (regex, ordered by specificity)
     Checked against preprocessed/normalized text. More specific patterns 
     are evaluated before broader ones.

  3. Keyword fallback
     If no regex matches, the message is split into tokens and compared
     against per-intent keyword sets.

Both layers are case-insensitive and strip punctuation before matching.

Returns
-------
IntentResult
    intent     — the classified Intent enum value
    confidence — float in [0.0, 1.0]
                   1.0  strong regex match
                   0.75 keyword fallback match
                   0.0  UNKNOWN / UNSUPPORTED
    matched_on — human-readable hint of what triggered the classification
                 (useful for debugging / future logging)
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from rapidfuzz import fuzz, process

from app.copilot.types import Intent


# ── Result model ──────────────────────────────────────────────────────────────

@dataclass
class IntentResult:
    """
    Output of detect_intent().

    Attributes
    ----------
    intent     : Intent   Classified intent.
    confidence : float    Detection confidence in [0.0, 1.0].
    matched_on : str      Debug hint — what rule/keyword triggered this result.
    """
    intent: Intent
    confidence: float
    matched_on: str = field(default="")


# ── Pattern rules (ordered — first match wins) ────────────────────────────────

_PATTERN_RULES: list[tuple[Intent, re.Pattern, float, str]] = [
    # GREETING intent is now handled separately by detect_greeting()
    
    # ── SCHEME_COMPARE ────────────────────────────────────────────────────────
    (
        Intent.SCHEME_COMPARE,
        re.compile(
            r"\b(compare|vs\.?|versus|difference\s+between|better\s+than|which\s+is\s+better)\b",
            re.IGNORECASE,
        ),
        1.0,
        "compare_pattern",
    ),

    # ── ELIGIBILITY ───────────────────────────────────────────────────────────
    (
        Intent.ELIGIBILITY,
        re.compile(
            r"\b(eligibl(e|ity)|qualif(y|ied|ication)|can\s+i\s+apply|can\s+i\s+get)\b",
            re.IGNORECASE,
        ),
        1.0,
        "eligibility_pattern",
    ),

    # ── ELIGIBILITY_REASON (fallback if anything specific is needed, though covered above) ───────────────────────
    (
        Intent.ELIGIBILITY_REASON,
        re.compile(
            r"\b(why\s+(am\s+i|are\s+you|is\s+my|not|don.t)\s*(eligible|qualify|qualified))"
            r"|(not\s+eligible\s*(because|reason|why))"
            r"|(reason\s+for\s+(ineligib|not\s+eligible))",
            re.IGNORECASE,
        ),
        1.0,
        "eligibility_reason_pattern",
    ),

    # ── REQUIRED_DOCUMENTS ────────────────────────────────────────────────────
    (
        Intent.REQUIRED_DOCUMENTS,
        re.compile(
            r"\b(what\s+documents?\s*(are|do\s+i)\s*(required|need|must|should)"
            r"|documents?\s+required"
            r"|required\s+documents?"
            r"|documents?\s+needed"
            r"|which\s+documents?\s+(do\s+i\s+need|are\s+required|to\s+submit))\b",
            re.IGNORECASE,
        ),
        1.0,
        "required_docs_pattern",
    ),

    # ── DOCUMENT_REMINDER (expiry focus — before DOCUMENT_STATUS) ─────────────
    (
        Intent.DOCUMENT_REMINDER,
        re.compile(
            r"\b(expir(e|es|ing|ed|ation|y)"
            r"|documents?\s+expir"
            r"|which\s+documents?\s+expir"
            r"|renew(al)?\s+remind"
            r"|remind\s+me\s+(about|when|before))\b",
            re.IGNORECASE,
        ),
        1.0,
        "doc_reminder_pattern",
    ),

    # ── DOCUMENT_UPLOAD ───────────────────────────────────────────────────────
    (
        Intent.DOCUMENT_UPLOAD,
        re.compile(
            r"\b(upload"
            r"|add\s+(my\s+)?(aadhaar|pan|passport|document|certificate|licence|license)"
            r"|submit\s+(document|proof|certificate)"
            r"|attach\s+(document|file))\b",
            re.IGNORECASE,
        ),
        1.0,
        "doc_upload_pattern",
    ),

    # ── DOCUMENT_STATUS ───────────────────────────────────────────────────────
    (
        Intent.DOCUMENT_STATUS,
        re.compile(
            r"\b(document\s+status"
            r"|status\s+of\s+(my\s+)?document"
            r"|is\s+my\s+document\s+(verified|approved|ready|uploaded)"
            r"|document\s+(verified|approved|pending|rejected))\b",
            re.IGNORECASE,
        ),
        1.0,
        "doc_status_pattern",
    ),

    # ── RENEWAL_GUIDE ─────────────────────────────────────────────────────────
    (
        Intent.RENEWAL_GUIDE,
        re.compile(
            r"\b(renew"
            r"|how\s+to\s+renew"
            r"|renewal\s+(process|guide|steps?|procedure)"
            r"|driving\s+licen(ce|se)\s+renew"
            r"|passport\s+renew"
            r"|aadhaar\s+update)\b",
            re.IGNORECASE,
        ),
        1.0,
        "renewal_pattern",
    ),

    # ── SCHEME_EXPLAIN ────────────────────────────────────────────────────────
    (
        Intent.SCHEME_EXPLAIN,
        re.compile(
            r"\b(explain"
            r"|what\s+is\s+(the\s+)?(pmegp|mudra|pmay|pm\s*kisan|ayushman|nrega|mnrega|jan\s*dhan)"
            r"|tell\s+me\s+about\s+(the\s+)?\w+\s+scheme"
            r"|describe\s+(the\s+)?\w+\s+scheme"
            r"|scheme\s+(details?|overview|summary|information))\b",
            re.IGNORECASE,
        ),
        1.0,
        "scheme_explain_pattern",
    ),

    # ── APP_HELP ──────────────────────────────────────────────────────────────
    (
        Intent.APP_HELP,
        re.compile(
            r"\b(how\s+(do\s+i\s+use|to\s+use)\s+(vault|this\s+app)"
            r"|how\s+does\s+(vault|this\s+app)\s+work"
            r"|app\s+(help|guide|tutorial|feature)"
            r"|what\s+can\s+(you|this\s+app)\s+do)\b",
            re.IGNORECASE,
        ),
        1.0,
        "app_help_pattern",
    ),
]


# ── Keyword fallback rules ────────────────────────────────────────────────────

_KEYWORD_RULES: list[tuple[Intent, frozenset, float, str]] = [
    (Intent.SCHEME_COMPARE,     frozenset({"compare", "vs", "versus", "difference"}),                             0.75, "compare_kw"),
    (Intent.ELIGIBILITY_REASON, frozenset({"ineligible", "disqualified", "rejected", "why not"}),                 0.75, "elig_reason_kw"),
    (Intent.ELIGIBILITY,        frozenset({"eligible", "eligibility", "qualify", "qualification", "criteria"}),   0.75, "eligibility_kw"),
    (Intent.REQUIRED_DOCUMENTS, frozenset({"required", "mandatory", "needed", "compulsory"}),                     0.75, "req_docs_kw"),
    (Intent.DOCUMENT_REMINDER,  frozenset({"expiry", "expiration", "expired", "expiring", "expires", "reminder"}),           0.75, "doc_reminder_kw"),
    (Intent.DOCUMENT_UPLOAD,    frozenset({"upload", "attach", "submit", "aadhaar", "pan", "passport"}),          0.75, "doc_upload_kw"),
    (Intent.DOCUMENT_STATUS,    frozenset({"status", "verified", "approved", "pending", "rejected"}),             0.75, "doc_status_kw"),
    (Intent.RENEWAL_GUIDE,      frozenset({"renew", "renewal", "update", "reissue"}),                             0.75, "renewal_kw"),
    (Intent.SCHEME_EXPLAIN,     frozenset({"scheme", "schemes", "yojana", "programme", "program", "pmegp", "mudra", "pmay", "pmkisan", "ayushman"}), 0.75, "scheme_explain_kw"),
    (Intent.APP_HELP,           frozenset({"help", "guide", "tutorial", "how", "use", "feature", "vault"}),       0.75, "app_help_kw"),
]


# ── Out-of-scope guard ────────────────────────────────────────────────────────

_VAULTGOV_ANCHORS: frozenset[str] = frozenset({
    "scheme", "yojana", "document", "aadhaar", "pan", "passport",
    "eligible", "eligibility", "qualify", "upload", "renew", "renewal",
    "expir", "status", "apply", "application", "government", "govt",
    "ministry", "benefit", "subsidy", "loan", "pmegp", "mudra", "pmay",
    "pmkisan", "ayushman", "nrega", "jan dhan", "pension", "vault",
    "licence", "license", "certificate", "compare", "explain",
})

# ── Greeting configuration ────────────────────────────────────────────────────

_VALID_GREETINGS = {
    "hi", "hello", "hey", "hlo", "yo", "sup", 
    "namaste", "howdy", "greetings"
}

_MULTI_WORD_GREETINGS = {
    "good morning", "good afternoon", "good evening"
}


# ── Public API ────────────────────────────────────────────────────────────────

def preprocess_text(text: str) -> str:
    """
    Prepares text for intent classification by normalizing casing, 
    spacing, punctuation, and chat variations (like repeated letters).
    """
    if not text:
        return ""
        
    # 1. Lowercase
    text = text.lower()
    
    # 2. Remove unnecessary punctuation (keep alphanumerics and spaces)
    text = re.sub(r"[^\w\s]", " ", text)
    
    # 3. Normalize repeated letters
    # Rule A: Reduce 3+ of ANY identical consecutive characters to just 1.
    # Safely handles extreme typos (e.g., "heeeello" -> "helo") without destroying 
    # legitimate double letters like 'll' in "hello".
    text = re.sub(r'(.)\1{2,}', r'\1', text)
    
    # Rule B: Specific normalization for trailing chat repetitions.
    # Replaces 2+ of 'i', 'y', or 'o' at the end of a word with a single letter.
    # Handles: "hii" -> "hi", "heyy" -> "hey", "helloo" -> "hello", "hloo" -> "hlo"
    text = re.sub(r'([iyo])\1+\b', r'\1', text)
    
    # 4. Remove extra spaces and strip
    text = re.sub(r"\s+", " ", text).strip()
    
    return text

def detect_greeting(normalised_text: str) -> bool:
    """
    Detects if the text contains a greeting using exact and fuzzy matching.
    """
    if not normalised_text:
        return False
        
    # 1. Multi-word exact match (fast path for "good morning" etc.)
    for mwg in _MULTI_WORD_GREETINGS:
        if mwg in normalised_text:
            return True
            
    tokens = set(normalised_text.split())
    
    # 2. Exact token matching for standard greetings
    if tokens.intersection(_VALID_GREETINGS):
        return True
        
    # 3. Fuzzy matching for slight spelling mistakes (e.g., "helo", "hllo")
    for token in tokens:
        # Skip very short tokens to avoid false positives (e.g., "a", "i")
        if len(token) < 3:
            continue
            
        best_match = process.extractOne(token, _VALID_GREETINGS, scorer=fuzz.ratio)
        if best_match and best_match[1] >= 85:
            return True
            
    return False

def _has_vaultgov_signal(normalised: str) -> bool:
    """Return True if the normalised message contains any VaultGov anchor."""
    tokens = set(normalised.split())
    for anchor in _VAULTGOV_ANCHORS:
        if anchor in tokens or any(anchor in tok for tok in tokens):
            return True
    return False

def detect_intent(message: str) -> IntentResult:
    """
    Classify the user message into an Intent using keyword/pattern matching.

    Parameters
    ----------
    message : str
        Raw user message (any casing, punctuation allowed).

    Returns
    -------
    IntentResult
        intent     — classified Intent enum value
        confidence — detection confidence in [0.0, 1.0]
        matched_on — debug label of the rule that fired
    """
    if not message or not message.strip():
        return IntentResult(intent=Intent.UNKNOWN, confidence=0.0, matched_on="empty_message")

    # PREPROCESSING
    normalised = preprocess_text(message)

    # 1. Detect if there's a greeting. We don't return immediately!
    # We want to let actionable intents like DOCUMENT_STATUS run first.
    is_greeting = detect_greeting(normalised)

    # 2. Priority regex patterns on NORMALIZED text
    for intent, pattern, confidence, label in _PATTERN_RULES:
        if pattern.search(normalised):
            return IntentResult(intent=intent, confidence=confidence, matched_on=label)

    # 3. Keyword fallback
    tokens = set(normalised.split())
    for intent, keywords, confidence, label in _KEYWORD_RULES:
        if tokens & keywords:
            return IntentResult(intent=intent, confidence=confidence, matched_on=label)

    # 4. If it was a greeting and NO other intent matched, now we can return GREETING
    if is_greeting:
        return IntentResult(intent=Intent.GREETING, confidence=1.0, matched_on="greeting_fuzzy")

    # 5. Out-of-scope guard
    if not _has_vaultgov_signal(normalised):
        return IntentResult(intent=Intent.UNSUPPORTED, confidence=0.0, matched_on="no_vaultgov_signal")

    # 6. Unknown fallback
    return IntentResult(intent=Intent.UNKNOWN, confidence=0.0, matched_on="no_match")
