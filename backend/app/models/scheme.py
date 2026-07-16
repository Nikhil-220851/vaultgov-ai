import hashlib
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import JSONB
from app.database.connection import Base


class Scheme(Base):
    """ORM model for the `schemes` table."""

    __tablename__ = "schemes"

    # ── Identity ──────────────────────────────────────────────────────────────
    schemeId              = Column("scheme_id",              String(100), primary_key=True, index=True)
    title                 = Column("title",                  String(255), nullable=False)
    subtitle              = Column("subtitle",               String(255), nullable=True)
    description           = Column("description",            String,      nullable=False)

    # ── Classification ────────────────────────────────────────────────────────
    category              = Column("category",               String(100), nullable=False)
    subcategory           = Column("subcategory",            String(100), nullable=True)

    # ── Content (JSONB) ───────────────────────────────────────────────────────
    benefits              = Column("benefits",               JSONB,       nullable=False, default=list)
    eligibility           = Column("eligibility",            String,      nullable=False)
    requiredDocuments     = Column("required_documents",     JSONB,       nullable=False, default=list)
    recommendedDocuments  = Column("recommended_documents",  JSONB,       nullable=False, default=list)

    # ── Eligibility Criteria ──────────────────────────────────────────────────
    gender                = Column("gender",                 String(50),  nullable=False, default="All")
    occupation            = Column("occupation",             String(100), nullable=False, default="Any")
    ageRange              = Column("age_range",              String(50),  nullable=False, default="All")
    incomeLimit           = Column("income_limit",           String(50),  nullable=False, default="All")
    education             = Column("education",              String(100), nullable=False, default="Any")
    state                 = Column("state",                  String(100), nullable=False, default="All")
    district              = Column("district",               String(100), nullable=True)

    # ── Application Info ──────────────────────────────────────────────────────
    applicationMode       = Column("application_mode",       String(50),  nullable=False, default="Online")
    applicationStart      = Column("application_start",      String(50),  nullable=False)
    applicationEnd        = Column("application_end",        String(50),  nullable=False)
    # status values: Active | Upcoming | Closing Soon | Permanent | Archived | Disabled
    status                = Column("status",                 String(50),  nullable=False, default="Active")

    # ── Official Links ────────────────────────────────────────────────────────
    officialWebsite       = Column("official_website",       String(255), nullable=False)
    officialApplyLink     = Column("official_apply_link",    String(255), nullable=False)
    officialNotification  = Column("official_notification",  String(500), nullable=True)

    # ── Provenance ────────────────────────────────────────────────────────────
    ministry              = Column("ministry",               String(255), nullable=False)
    launchYear            = Column("launch_year",            Integer,     nullable=False)

    # ── Source Metadata (for Verified badge) ─────────────────────────────────
    sourceName            = Column("source_name",            String(255), nullable=True)
    sourceURL             = Column("source_url",             String(500), nullable=True)
    verifiedBy            = Column("verified_by",            String(100), nullable=True)
    verificationDate      = Column("verification_date",      String(50),  nullable=True)

    # ── Sync / Versioning ─────────────────────────────────────────────────────
    version               = Column("version",                Integer,     nullable=False, default=1)
    contentHash           = Column("content_hash",           String(64),  nullable=True)
    lastUpdated           = Column("last_updated",           String(50),  nullable=False)
    lastVerified          = Column("last_verified",          String(50),  nullable=False)

    # ── Discovery Score ───────────────────────────────────────────────────────
    priorityScore         = Column("priority_score",         Integer,     nullable=False, default=0)
    tags                  = Column("tags",                   JSONB,       nullable=False, default=list)


def generate_content_hash(scheme_data: dict) -> str:
    """
    Generate a SHA-256 hash over the fields that define scheme content.
    Used during sync to detect actual changes without version bumps.
    """
    fields = {
        "title":             scheme_data.get("title", ""),
        "description":       scheme_data.get("description", ""),
        "eligibility":       scheme_data.get("eligibility", ""),
        "benefits":          scheme_data.get("benefits", []),
        "requiredDocuments": scheme_data.get("requiredDocuments", []),
        "applicationEnd":    scheme_data.get("applicationEnd", ""),
    }
    canonical = json.dumps(fields, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class SchemeAuditLog(Base):
    """Records every admin mutation to a scheme for auditing."""

    __tablename__ = "scheme_audit_log"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id      = Column("scheme_id",     String(100), nullable=False, index=True)
    admin_uid      = Column("admin_uid",     String(128), nullable=False, index=True)
    action         = Column("action",        String(50),  nullable=False)
    timestamp      = Column("timestamp",     String(50),  nullable=False)
    previous_value = Column("previous_value", JSONB,      nullable=True)
    updated_value  = Column("updated_value",  JSONB,      nullable=True)
