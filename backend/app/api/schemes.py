"""
schemes.py — Scheme discovery and admin management API endpoints.

Read endpoints  → all authenticated users (get_current_uid)
Write endpoints → administrators only (require_admin)

Status lifecycle:
    Active | Upcoming | Closing Soon | Permanent | Archived | Disabled
    Archived/Disabled schemes are excluded from all public listings.
    They remain in the database for audit history and potential reactivation.
"""

import math
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.admin_auth import require_admin
from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.models.scheme import Scheme, SchemeAuditLog, generate_content_hash
from app.schemas.scheme import (
    BenefitsUpdate,
    DeadlineUpdate,
    EligibilityUpdate,
    SchemeCreate,
    SchemeResponse,
    SchemeSearchResponse,
    SchemeSyncResponse,
    SchemeUpdate,
)

router = APIRouter(prefix="/schemes", tags=["schemes"])

# Statuses visible to end-users (excludes Archived and Disabled)
_PUBLIC_STATUSES = ("Active", "Upcoming", "Closing Soon", "Permanent")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _write_audit(
    db: Session,
    scheme_id: str,
    admin_uid: str,
    action: str,
    previous: dict,
    updated: dict,
) -> None:
    """Record an admin mutation in scheme_audit_log."""
    log = SchemeAuditLog(
        scheme_id=scheme_id,
        admin_uid=admin_uid,
        action=action,
        timestamp=_now_iso(),
        previous_value=previous,
        updated_value=updated,
    )
    db.add(log)


def _refresh_hash_and_version(scheme: Scheme) -> None:
    """Regenerate content_hash and bump version after any content change."""
    scheme.contentHash = generate_content_hash({
        "title":             scheme.title,
        "description":       scheme.description,
        "eligibility":       scheme.eligibility,
        "benefits":          scheme.benefits,
        "requiredDocuments": scheme.requiredDocuments,
        "applicationEnd":    scheme.applicationEnd,
    })
    scheme.version = (scheme.version or 0) + 1
    scheme.lastUpdated = _now_iso()
    scheme.lastVerified = _now_iso()
    scheme.verifiedBy = "VaultGov Backend"
    scheme.verificationDate = _now_iso()


# ─── READ ENDPOINTS (authenticated users) ────────────────────────────────────

@router.get("/", response_model=List[SchemeResponse])
def get_active_schemes(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> List[SchemeResponse]:
    """Returns all publicly visible schemes (Active, Upcoming, Closing Soon, Permanent)."""
    schemes = (
        db.query(Scheme)
        .filter(Scheme.status.in_(_PUBLIC_STATUSES))
        .order_by(Scheme.priorityScore.desc())
        .all()
    )
    return [SchemeResponse.model_validate(s) for s in schemes]


@router.get("/search", response_model=SchemeSearchResponse)
def search_schemes(
    q:          Optional[str] = Query(None, description="Keyword search across title, description, tags"),
    category:   Optional[str] = Query(None),
    occupation: Optional[str] = Query(None),
    gender:     Optional[str] = Query(None),
    age:        Optional[int] = Query(None, description="User age for range filtering"),
    state:      Optional[str] = Query(None),
    education:  Optional[str] = Query(None),
    income:     Optional[str] = Query(None, description="Income slab: EWS | LIG | MIG | HIG | All"),
    status:     Optional[str] = Query(None, description="Filter by status; defaults to public statuses"),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(20, ge=1, le=100),
    db:         Session       = Depends(get_db),
    current_uid: str          = Depends(get_current_uid),
) -> SchemeSearchResponse:
    """
    Full-text and faceted scheme search with pagination.
    Returns only publicly visible schemes unless a specific status is supplied.
    """
    query = db.query(Scheme)

    # Status filter
    if status:
        query = query.filter(Scheme.status == status)
    else:
        query = query.filter(Scheme.status.in_(_PUBLIC_STATUSES))

    # Keyword search across title, subtitle, description, tags (cast to text)
    if q:
        kw = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Scheme.title).like(kw),
                func.lower(Scheme.subtitle).like(kw),
                func.lower(Scheme.description).like(kw),
                func.lower(Scheme.eligibility).like(kw),
            )
        )

    if category:
        query = query.filter(func.lower(Scheme.category) == category.lower())

    if occupation:
        query = query.filter(
            or_(
                func.lower(Scheme.occupation) == occupation.lower(),
                func.lower(Scheme.occupation) == "any",
            )
        )

    if gender:
        query = query.filter(
            or_(
                func.lower(Scheme.gender) == gender.lower(),
                func.lower(Scheme.gender) == "all",
            )
        )

    if state:
        query = query.filter(
            or_(
                func.lower(Scheme.state) == state.lower(),
                func.lower(Scheme.state) == "all",
            )
        )

    if education:
        query = query.filter(
            or_(
                func.lower(Scheme.education) == education.lower(),
                func.lower(Scheme.education) == "any",
            )
        )

    if income:
        # Income slab hierarchy: EWS(1) < LIG(2) < MIG(3) < HIG(4) | All = always match
        SLAB_ORDER = {"EWS": 1, "LIG": 2, "MIG": 3, "HIG": 4, "ALL": 99}
        user_slab = SLAB_ORDER.get(income.upper(), 99)
        # Include scheme if its income limit >= user's slab OR is "All"
        eligible_slabs = [k for k, v in SLAB_ORDER.items() if v >= user_slab or k == "ALL"]
        query = query.filter(Scheme.incomeLimit.in_(eligible_slabs))

    if age is not None:
        # Crude age filter — include schemes where ageRange is "All" or overlaps
        # Fine-grained filtering happens in the mobile eligibility engine
        query = query.filter(
            or_(
                func.lower(Scheme.ageRange) == "all",
                Scheme.ageRange.like(f"{age}%"),
            )
        )

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    results = (
        query.order_by(Scheme.priorityScore.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return SchemeSearchResponse(
        results=[SchemeResponse.model_validate(s) for s in results],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/sync", response_model=SchemeSyncResponse)
def sync_schemes(
    since: Optional[str] = Query(None, description="ISO timestamp of last successful sync"),
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> SchemeSyncResponse:
    """
    Delta sync endpoint. Returns only changed records since the last sync.
    The mobile client should store `serverTime` as `lastSyncTime` — never use device clock.
    """
    server_time = _now_iso()
    max_version_res = db.query(func.max(Scheme.version)).scalar()
    latest_version = max_version_res if max_version_res is not None else 1

    if not since:
        # Initial sync: return all publicly visible schemes as new
        new_schemes = (
            db.query(Scheme)
            .filter(Scheme.status.in_(_PUBLIC_STATUSES))
            .all()
        )
        return SchemeSyncResponse(
            newSchemes=[SchemeResponse.model_validate(s) for s in new_schemes],
            updatedSchemes=[],
            archivedSchemes=[],
            serverTime=server_time,
            latestVersion=latest_version,
        )

    # Delta sync: everything updated after `since`
    changed = db.query(Scheme).filter(Scheme.lastUpdated > since).all()

    new_schemes, updated_schemes, archived_schemes = [], [], []
    for s in changed:
        if s.status in ("Archived", "Disabled"):
            archived_schemes.append(s)
        elif s.version == 1:
            new_schemes.append(s)
        else:
            updated_schemes.append(s)

    return SchemeSyncResponse(
        newSchemes=[SchemeResponse.model_validate(s) for s in new_schemes],
        updatedSchemes=[SchemeResponse.model_validate(s) for s in updated_schemes],
        archivedSchemes=[SchemeResponse.model_validate(s) for s in archived_schemes],
        serverTime=server_time,
        latestVersion=latest_version,
    )


@router.get("/{scheme_id}", response_model=SchemeResponse)
def get_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> SchemeResponse:
    """Returns a single scheme by its schemeId."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")
    return SchemeResponse.model_validate(scheme)


# ─── ADMIN WRITE ENDPOINTS ────────────────────────────────────────────────────

@router.post("/", response_model=SchemeResponse, status_code=status.HTTP_201_CREATED)
def create_scheme(
    body: SchemeCreate,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Add a new verified government scheme."""
    existing = db.query(Scheme).filter(Scheme.schemeId == body.schemeId).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheme '{body.schemeId}' already exists. Use PUT to update.",
        )

    now = _now_iso()
    content_hash = generate_content_hash(body.model_dump())

    scheme = Scheme(
        schemeId=body.schemeId,
        title=body.title,
        subtitle=body.subtitle,
        description=body.description,
        category=body.category,
        subcategory=body.subcategory,
        benefits=body.benefits,
        eligibility=body.eligibility,
        requiredDocuments=body.requiredDocuments,
        recommendedDocuments=body.recommendedDocuments,
        gender=body.gender,
        occupation=body.occupation,
        ageRange=body.ageRange,
        incomeLimit=body.incomeLimit,
        education=body.education,
        state=body.state,
        district=body.district,
        applicationMode=body.applicationMode,
        applicationStart=body.applicationStart,
        applicationEnd=body.applicationEnd,
        status=body.status,
        officialWebsite=body.officialWebsite,
        officialApplyLink=body.officialApplyLink,
        officialNotification=body.officialNotification,
        ministry=body.ministry,
        launchYear=body.launchYear,
        sourceName=body.sourceName,
        sourceURL=body.sourceURL,
        verifiedBy=body.verifiedBy or "VaultGov Backend",
        verificationDate=now,
        version=1,
        contentHash=content_hash,
        lastUpdated=now,
        lastVerified=now,
        priorityScore=body.priorityScore,
        tags=body.tags,
    )
    db.add(scheme)
    _write_audit(db, body.schemeId, admin_uid, "CREATE", {}, body.model_dump())
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.put("/{scheme_id}", response_model=SchemeResponse)
def update_scheme(
    scheme_id: str,
    body: SchemeUpdate,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Full or partial update of a scheme. Only send changed fields."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev = SchemeResponse.model_validate(scheme).model_dump()
    update_data = body.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(scheme, field, value)

    _refresh_hash_and_version(scheme)
    _write_audit(db, scheme_id, admin_uid, "UPDATE", prev, update_data)
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.patch("/{scheme_id}/archive", response_model=SchemeResponse)
def archive_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Soft-archive a scheme. Archived schemes are hidden from users but kept for history."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev_status = scheme.status
    scheme.status = "Archived"
    scheme.lastUpdated = _now_iso()
    scheme.version = (scheme.version or 0) + 1
    _write_audit(db, scheme_id, admin_uid, "ARCHIVE", {"status": prev_status}, {"status": "Archived"})
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.patch("/{scheme_id}/disable", response_model=SchemeResponse)
def disable_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """
    [Admin] Soft-disable a scheme instead of permanent deletion.
    Disabled schemes are removed from all public listings but kept in the database.
    """
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev_status = scheme.status
    scheme.status = "Disabled"
    scheme.lastUpdated = _now_iso()
    scheme.version = (scheme.version or 0) + 1
    _write_audit(db, scheme_id, admin_uid, "DISABLE", {"status": prev_status}, {"status": "Disabled"})
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.patch("/{scheme_id}/deadline", response_model=SchemeResponse)
def update_deadline(
    scheme_id: str,
    body: DeadlineUpdate,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Update the application deadline (applicationEnd) for a scheme."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev = {"applicationEnd": scheme.applicationEnd}
    scheme.applicationEnd = body.applicationEnd
    _refresh_hash_and_version(scheme)
    _write_audit(db, scheme_id, admin_uid, "UPDATE_DEADLINE", prev, body.model_dump())
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.patch("/{scheme_id}/benefits", response_model=SchemeResponse)
def update_benefits(
    scheme_id: str,
    body: BenefitsUpdate,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Replace the benefits list for a scheme."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev = {"benefits": scheme.benefits}
    scheme.benefits = body.benefits
    _refresh_hash_and_version(scheme)
    _write_audit(db, scheme_id, admin_uid, "UPDATE_BENEFITS", prev, body.model_dump())
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


@router.patch("/{scheme_id}/eligibility", response_model=SchemeResponse)
def update_eligibility(
    scheme_id: str,
    body: EligibilityUpdate,
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> SchemeResponse:
    """[Admin] Update eligibility text and/or demographic criteria for a scheme."""
    scheme = db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    prev = {
        "eligibility": scheme.eligibility,
        "gender":      scheme.gender,
        "occupation":  scheme.occupation,
        "ageRange":    scheme.ageRange,
        "incomeLimit": scheme.incomeLimit,
        "education":   scheme.education,
        "state":       scheme.state,
        "district":    scheme.district,
    }
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scheme, field, value)

    _refresh_hash_and_version(scheme)
    _write_audit(db, scheme_id, admin_uid, "UPDATE_ELIGIBILITY", prev, update_data)
    db.commit()
    db.refresh(scheme)
    return SchemeResponse.model_validate(scheme)


# ─── ADMIN — Audit Log Viewer ─────────────────────────────────────────────────

@router.get("/{scheme_id}/audit", tags=["admin"])
def get_scheme_audit_log(
    scheme_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_uid: str = Depends(require_admin),
) -> list:
    """[Admin] Returns the full audit trail for a scheme."""
    logs = (
        db.query(SchemeAuditLog)
        .filter(SchemeAuditLog.scheme_id == scheme_id)
        .order_by(SchemeAuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id":             log.id,
            "scheme_id":      log.scheme_id,
            "admin_uid":      log.admin_uid,
            "action":         log.action,
            "timestamp":      log.timestamp,
            "previous_value": log.previous_value,
            "updated_value":  log.updated_value,
        }
        for log in logs
    ]
