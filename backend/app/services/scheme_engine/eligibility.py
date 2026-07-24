"""
eligibility.py — Pure eligibility calculation logic.

No I/O. No database calls. Takes a SchemeDefinition and a list of
DocumentSnapshots and returns a SchemeRecommendation.

Design principles:
  - Stateless function — easy to unit-test
  - Uses Phase 5 expiry status from the vault — never re-runs OCR
  - No hardcoded if-else per document type; all driven by JSON schema
"""

from typing import Dict, List

from .models import (
    DocumentSnapshot,
    EligibilityStatus,
    SchemeDefinition,
    SchemeRecommendation,
)


def _build_vault_index(documents: List[DocumentSnapshot]) -> Dict[str, DocumentSnapshot]:
    """
    Build a dict keyed by template_id for O(1) lookups.

    If multiple documents share the same template_id (e.g. two Aadhaar
    uploads), prefer the one with the better health score and ACTIVE status.
    """
    index: Dict[str, DocumentSnapshot] = {}
    for doc in documents:
        tid = doc.template_id
        if not tid:
            continue
        existing = index.get(tid)
        if existing is None:
            index[tid] = doc
        else:
            # Prefer ACTIVE > EXPIRING_SOON > EXPIRED > NO_EXPIRY
            _STATUS_RANK = {
                "ACTIVE": 4,
                "EXPIRING_SOON": 3,
                "EXPIRED": 2,
                "NO_EXPIRY": 1,
                "INVALID_DATE": 0,
            }
            new_rank = _STATUS_RANK.get(doc.status or "", 0)
            old_rank = _STATUS_RANK.get(existing.status or "", 0)
            if new_rank > old_rank:
                index[tid] = doc
    return index


def calculate_eligibility(
    scheme: SchemeDefinition,
    documents: List[DocumentSnapshot],
) -> SchemeRecommendation:
    """
    Core eligibility calculation.

    Algorithm
    ---------
    1. Index the user's vault documents by template_id.
    2. For each required_document in the scheme:
       a. If NOT in vault → MISSING
       b. If in vault with status EXPIRED → EXPIRED (downgrades eligibility)
       c. If in vault with status EXPIRING_SOON → EXPIRING_SOON (warning)
       d. Otherwise → MATCHED
    3. Determine overall eligibility:
       - All required matched (none expired) → Eligible
       - Some required missing → Not Eligible
       - All matched but some expired → Partially Eligible
    4. Calculate a health_score 0–100:
       - Start at 100
       - -30 per missing required document (proportional, capped at 0)
       - -10 per expired required document
       - -5 per expiring-soon required document
    """
    vault_index = _build_vault_index(documents)

    matched_documents: List[str] = []
    missing_documents: List[str] = []
    expired_documents: List[str] = []
    expiring_soon_documents: List[str] = []

    required = scheme.required_documents

    for template_id in required:
        doc = vault_index.get(template_id)
        if doc is None:
            missing_documents.append(template_id)
        elif doc.status == "EXPIRED":
            expired_documents.append(doc.title)
            matched_documents.append(doc.title)   # technically present, but expired
        elif doc.status == "EXPIRING_SOON":
            expiring_soon_documents.append(doc.title)
            matched_documents.append(doc.title)
        else:
            matched_documents.append(doc.title)

    required_count = len(required)
    matched_count = required_count - len(missing_documents)
    completion_pct = (matched_count / required_count * 100) if required_count > 0 else 100.0

    # Determine status
    if missing_documents:
        status = EligibilityStatus.NOT_ELIGIBLE
    elif expired_documents:
        status = EligibilityStatus.PARTIAL
    else:
        status = EligibilityStatus.ELIGIBLE

    # Calculate health score
    penalty_missing = len(missing_documents) * (100 / required_count if required_count else 0)
    penalty_expired = len(expired_documents) * 10
    penalty_expiring = len(expiring_soon_documents) * 5
    health_score = max(0.0, 100.0 - penalty_missing - penalty_expired - penalty_expiring)
    health_score = round(health_score, 1)

    return SchemeRecommendation(
        scheme_id=scheme.scheme_id,
        scheme_name=scheme.display_name,
        category=scheme.category,
        priority=scheme.priority,
        description=scheme.description,
        official_link=scheme.official_link,
        eligibility_notes=scheme.eligibility_notes,
        status=status,
        health_score=health_score,
        matched_documents=matched_documents,
        missing_documents=missing_documents,
        expired_documents=expired_documents,
        expiring_soon_documents=expiring_soon_documents,
        required_count=required_count,
        matched_count=matched_count,
        completion_pct=round(completion_pct, 1),
    )
