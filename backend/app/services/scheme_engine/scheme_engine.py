"""
scheme_engine.py — Orchestrator for the Smart Scheme Intelligence Engine.

Responsibilities:
  1. Read documents from the Vault (via SQLAlchemy session, read-only).
  2. Map ORM Document objects into DocumentSnapshot (no duplication).
  3. Run eligibility calculation per scheme (via eligibility.py).
  4. Return sorted SchemeRecommendation list.

The engine does NOT:
  - Re-run OCR
  - Re-run Gemini
  - Create or modify any documents
  - Hardcode any scheme logic
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.document import Document
from .eligibility import calculate_eligibility
from .models import DocumentSnapshot, SchemeRecommendation
from .scheme_registry import scheme_registry


class SchemeEngine:
    """
    Orchestrates scheme eligibility for a specific user.

    Usage:
        engine = SchemeEngine()
        results = engine.get_recommendations(db, user_id)
    """

    def get_recommendations(
        self,
        db: Session,
        user_id: UUID,
        category: Optional[str] = None,
    ) -> List[SchemeRecommendation]:
        """
        Calculate scheme eligibility for a user's current Vault documents.

        Parameters
        ----------
        db       : Active SQLAlchemy session (read-only usage)
        user_id  : The authenticated user's UUID
        category : Optional filter — if provided, only returns schemes in that category

        Returns
        -------
        List of SchemeRecommendation, sorted by:
          1. Eligible first, then Partially Eligible, then Not Eligible
          2. Within each group, highest health_score first
        """
        # ── Step 1: Read vault documents (no side effects) ─────────────────────
        orm_docs = (
            db.query(Document)
            .filter(Document.user_id == user_id)
            .all()
        )

        # ── Step 2: Project ORM → DocumentSnapshot ─────────────────────────────
        # template_id is derived from the document's category and title mapping.
        # Documents saved by the ingestion pipeline store the template_id
        # indirectly via the `category` field. The TemplateMatcher stores
        # `document_type` as the category field. We resolve it here.
        snapshots = [self._project(doc) for doc in orm_docs]

        # ── Step 3: Load scheme registry ───────────────────────────────────────
        schemes = scheme_registry.get_all()
        if category:
            schemes = [s for s in schemes if s.category.lower() == category.lower()]

        # ── Step 4: Evaluate eligibility per scheme ────────────────────────────
        recommendations: List[SchemeRecommendation] = []
        for scheme in schemes:
            rec = calculate_eligibility(scheme, snapshots)
            recommendations.append(rec)

        # ── Step 5: Sort results ───────────────────────────────────────────────
        _STATUS_ORDER = {
            "Eligible": 0,
            "Partially Eligible": 1,
            "Not Eligible": 2,
        }
        recommendations.sort(
            key=lambda r: (_STATUS_ORDER.get(r.status, 9), -r.health_score)
        )

        return recommendations

    def _project(self, doc: Document) -> DocumentSnapshot:
        """
        Convert an ORM Document into a lightweight DocumentSnapshot.

        template_id resolution strategy:
          The pipeline stores the matched template_id (e.g. "aadhaar", "pan")
          inside the extracted_text as:
            --- STRUCTURED FIELDS ---
          But more reliably, the TemplateMatcher result is stored in the
          `category` column during ingestion (e.g. "Identity", "Certificates").

          To match against scheme required_documents by template_id we need
          a reliable reverse mapping. We store the document_type (template_id)
          inside the extracted_text header line that Gemini returns. Specifically
          the ingestion service stores `doc_type` into the structured fields.

          Fallback resolution order:
            1. Try to extract `document_type:` from extracted_text
            2. Use a canonical category→template_id mapping

          This keeps the engine schema-driven without touching OCR/Gemini.
        """
        template_id = self._resolve_template_id(doc)
        return DocumentSnapshot(
            id=str(doc.id),
            title=doc.title,
            template_id=template_id,
            category=doc.category,
            status=doc.status,
            health_score=doc.health_score,
            renewal_priority=doc.renewal_priority,
        )

    def _resolve_template_id(self, doc: Document) -> Optional[str]:
        """
        Resolve the template_id for a vault document.

        Strategy: scan the extracted_text for the structured fields block
        and look for a `document_type` annotation. Fall back to title-based
        heuristics using a canonical template map.
        """
        extracted = doc.extracted_text or ""

        # Strategy 1: Check if structured block contains document_type marker
        if "--- STRUCTURED FIELDS ---" in extracted:
            structured_part = extracted.split("--- STRUCTURED FIELDS ---")[1]
            for line in structured_part.strip().splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    if key.strip().lower() == "document_type":
                        candidate = val.strip().lower().replace(" ", "_")
                        if candidate:
                            return candidate

        # Strategy 2: Canonical title→template_id heuristic map
        title_lower = (doc.title or "").lower()
        category_lower = (doc.category or "").lower()
        text_lower = extracted[:300].lower()  # Only scan header, not full text

        _HEURISTICS = [
            (["aadhaar", "aadhar", "uid"], "aadhaar"),
            (["pan card", "permanent account"], "pan"),
            (["passport"], "passport"),
            (["driving licence", "driving license", "dl"], "driving_license"),
            (["voter id", "election commission", "epic"], "voter_id"),
            (["bank passbook", "passbook", "savings account"], "bank_passbook"),
            (["income certificate"], "income_certificate"),
            (["caste certificate"], "caste_certificate"),
            (["ews certificate", "economically weaker"], "ews_certificate"),
            (["domicile certificate", "residence certificate"], "domicile_certificate"),
            (["birth certificate"], "birth_certificate"),
            (["10th", "ssc", "matriculation", "class x"], "10th_marksheet"),
            (["12th", "hsc", "intermediate", "class xii"], "12th_marksheet"),
            (["degree certificate", "bachelor", "graduation"], "degree_certificate"),
            (["ration card"], "ration_card"),
            (["cancelled cheque", "cancel cheque"], "cancelled_cheque"),
            (["land record", "khasra", "khatauni"], "land_record"),
        ]

        combined = f"{title_lower} {category_lower} {text_lower}"
        for keywords, template_id in _HEURISTICS:
            if any(kw in combined for kw in keywords):
                return template_id

        return None


# Process-level singleton
scheme_engine = SchemeEngine()
