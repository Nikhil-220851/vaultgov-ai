"""
scheme_sync_job.py — Backend automatic scheme synchronisation service.

Architecture:
    SyncScheduler    — schedules the job every 24 hours
    SchemeSyncService — coordinates the sync flow
    SchemeParser      — validates and parses raw payloads into ORM objects
    SchemeRepository  — database transactions (upsert, archive, query)

The scheduler is triggered by the FastAPI startup event.
It runs archiveExpiredSchemes() and future official-source pulls every 24 hours.

NOTE: Actual scraping from official government sources is intentionally NOT
implemented here — that violates the design mandate. Instead, admins update
schemes via the Admin API endpoints. This service only handles expiration
archival and future integrations with official push-based data feeds.
"""

import hashlib
import json
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.scheme import Scheme, generate_content_hash
from app.services.notification_engine import notification_engine


# ─── Repository ───────────────────────────────────────────────────────────────

class SchemeRepository:
    """
    Data-access layer for scheme records.
    All DB mutations go through this class to centralise transaction logic.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(self) -> Dict[str, Scheme]:
        schemes = self.db.query(Scheme).all()
        return {s.schemeId: s for s in schemes}

    def get_active(self) -> List[Scheme]:
        return (
            self.db.query(Scheme)
            .filter(Scheme.status.in_(("Active", "Upcoming", "Closing Soon", "Permanent")))
            .all()
        )

    def upsert(self, scheme_data: dict, now_iso: str) -> tuple[bool, bool]:
        """
        Inserts or updates a scheme based on schemeId.
        Returns (was_inserted: bool, was_updated: bool).
        Content hash comparison ensures we only write genuine changes.
        """
        scheme_id = scheme_data["schemeId"]
        existing = self.db.query(Scheme).filter(Scheme.schemeId == scheme_id).first()

        new_hash = generate_content_hash(scheme_data)

        if not existing:
            # Insert new scheme
            scheme = Scheme(
                schemeId=scheme_data["schemeId"],
                title=scheme_data["title"],
                subtitle=scheme_data.get("subtitle"),
                description=scheme_data["description"],
                category=scheme_data["category"],
                subcategory=scheme_data.get("subcategory"),
                benefits=scheme_data["benefits"],
                eligibility=scheme_data["eligibility"],
                requiredDocuments=scheme_data["requiredDocuments"],
                recommendedDocuments=scheme_data.get("recommendedDocuments", []),
                gender=scheme_data.get("gender", "All"),
                occupation=scheme_data.get("occupation", "Any"),
                ageRange=scheme_data.get("ageRange", "All"),
                incomeLimit=scheme_data.get("incomeLimit", "All"),
                education=scheme_data.get("education", "Any"),
                state=scheme_data.get("state", "All"),
                district=scheme_data.get("district"),
                applicationMode=scheme_data.get("applicationMode", "Online"),
                applicationStart=scheme_data["applicationStart"],
                applicationEnd=scheme_data["applicationEnd"],
                status=scheme_data.get("status", "Active"),
                officialWebsite=scheme_data["officialWebsite"],
                officialApplyLink=scheme_data["officialApplyLink"],
                officialNotification=scheme_data.get("officialNotification"),
                ministry=scheme_data["ministry"],
                launchYear=scheme_data["launchYear"],
                sourceName=scheme_data.get("sourceName"),
                sourceURL=scheme_data.get("sourceURL"),
                verifiedBy=scheme_data.get("verifiedBy", "VaultGov Backend"),
                verificationDate=now_iso,
                version=1,
                contentHash=new_hash,
                lastUpdated=now_iso,
                lastVerified=now_iso,
                priorityScore=scheme_data.get("priorityScore", 5),
                tags=scheme_data.get("tags", []),
            )
            self.db.add(scheme)
            return True, False

        # Check if content actually changed
        version_changed = scheme_data.get("version", 1) > (existing.version or 0)
        hash_changed = new_hash != (existing.contentHash or "")

        if version_changed or hash_changed:
            existing.title = scheme_data["title"]
            existing.subtitle = scheme_data.get("subtitle", existing.subtitle)
            existing.description = scheme_data["description"]
            existing.benefits = scheme_data["benefits"]
            existing.eligibility = scheme_data["eligibility"]
            existing.requiredDocuments = scheme_data["requiredDocuments"]
            existing.recommendedDocuments = scheme_data.get("recommendedDocuments", existing.recommendedDocuments)
            existing.applicationEnd = scheme_data["applicationEnd"]
            existing.status = scheme_data.get("status", existing.status)
            existing.officialWebsite = scheme_data["officialWebsite"]
            existing.officialApplyLink = scheme_data["officialApplyLink"]
            existing.officialNotification = scheme_data.get("officialNotification", existing.officialNotification)
            existing.sourceName = scheme_data.get("sourceName", existing.sourceName)
            existing.sourceURL = scheme_data.get("sourceURL", existing.sourceURL)
            existing.priorityScore = scheme_data.get("priorityScore", existing.priorityScore)
            existing.tags = scheme_data.get("tags", existing.tags)
            existing.contentHash = new_hash
            existing.version = (existing.version or 0) + 1
            existing.lastUpdated = now_iso
            existing.lastVerified = now_iso
            existing.verifiedBy = "VaultGov Backend"
            existing.verificationDate = now_iso
            return False, True

        return False, False

    def archive_expired(self, now_iso: str) -> int:
        """Archive schemes whose applicationEnd date has passed. Returns count archived."""
        today = datetime.now(timezone.utc).date()
        archived_count = 0
        active_schemes = self.get_active()

        for scheme in active_schemes:
            if scheme.applicationEnd in ("Permanent", "permanent", ""):
                continue
            try:
                end_date = datetime.strptime(scheme.applicationEnd, "%Y-%m-%d").date()
                if end_date < today:
                    print(f"[SchemeRepository] Archiving expired scheme: {scheme.title} (ended {scheme.applicationEnd})")
                    scheme.status = "Archived"
                    scheme.version = (scheme.version or 0) + 1
                    scheme.lastUpdated = now_iso
                    archived_count += 1
            except ValueError:
                pass  # Non-parseable dates (e.g. "Permanent") are skipped above

        return archived_count


# ─── Parser ───────────────────────────────────────────────────────────────────

class SchemeParser:
    """
    Validates and normalises raw scheme payloads before they are persisted.
    Only government-verified data should pass through here.
    """

    REQUIRED_FIELDS = (
        "schemeId", "title", "description", "category", "benefits",
        "eligibility", "requiredDocuments", "officialWebsite",
        "officialApplyLink", "ministry", "launchYear",
        "applicationStart", "applicationEnd",
    )

    def parse(self, raw_payload: Any) -> List[dict]:
        """Parse a raw list of scheme dicts, dropping any that fail validation."""
        if not raw_payload or not isinstance(raw_payload, list):
            return []

        valid = []
        for item in raw_payload:
            if not isinstance(item, dict):
                continue
            missing = [f for f in self.REQUIRED_FIELDS if not item.get(f)]
            if missing:
                print(f"[SchemeParser] Skipping scheme '{item.get('schemeId', '?')}' — missing: {missing}")
                continue
            valid.append(item)

        return valid


# ─── SchemeSyncService ────────────────────────────────────────────────────────

class SchemeSyncService:
    """
    Coordinates the backend synchronisation cycle:
    1. Archive any schemes whose deadline has passed.
    2. (Future) Pull updates from official government data feeds.
    3. Compare by version AND contentHash before writing.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SchemeRepository(db)
        self.parser = SchemeParser()

    def run(self) -> dict:
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        print(f"[SchemeSyncService] Starting sync at {now}")

        # Step 1: Archive expired schemes
        archived = self.repository.archive_expired(now)
        self.db.commit()

        # Step 2: Generate Smart Vault Notifications
        try:
            print("[SchemeSyncService] Running Expiry Notification Engine...")
            notification_engine.generate_expiry_notifications(self.db)
        except Exception as e:
            print(f"[SchemeSyncService] Failed to generate expiry notifications: {e}")

        # Step 3: (Future) Process payloads from official data feeds.
        # When official APIs become available, parse and upsert here.
        # raw_payload = official_source_client.fetch()
        # valid_records = self.parser.parse(raw_payload)
        # for record in valid_records:
        #     self.repository.upsert(record, now)
        # self.db.commit()

        print(f"[SchemeSyncService] Sync complete — {archived} scheme(s) archived.")
        return {"archived": archived, "timestamp": now}


# ─── Scheduler ────────────────────────────────────────────────────────────────

class SyncScheduler:
    """
    Runs SchemeSyncService on a 24-hour interval using a background thread.
    Started from the FastAPI startup event in main.py.
    """

    INTERVAL_SECONDS = 86_400  # 24 hours

    def __init__(self, db_url: str) -> None:
        self.db_url = db_url
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def _make_session(self) -> Session:
        engine = create_engine(self.db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return SessionLocal()

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                db = self._make_session()
                SchemeSyncService(db).run()
                db.close()
            except Exception as exc:
                print(f"[SyncScheduler] Error during scheduled sync: {exc}")
            self._stop_event.wait(timeout=self.INTERVAL_SECONDS)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="SyncScheduler")
        self._thread.start()
        print(f"[SyncScheduler] Background sync started — interval: {self.INTERVAL_SECONDS // 3600}h")

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        print("[SyncScheduler] Background sync stopped.")


# ─── Standalone entry point (for manual runs) ─────────────────────────────────

def run_daily_sync_job(db: Session) -> None:
    """Convenience wrapper for running the sync job with an existing session."""
    SchemeSyncService(db).run()


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(bind=engine)
        db_session = SessionLocal()
        try:
            run_daily_sync_job(db_session)
        finally:
            db_session.close()
