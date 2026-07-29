"""
notification_scheduler.py — Scheduled notification jobs for VaultGov AI.

Architecture:
    Mirrors the exact threading pattern of SyncScheduler in scheme_sync_job.py.
    Three independent schedules run on a single daemon thread using a tight
    sleep loop that checks each job's last-run timestamp:

        Daily   (00:01 UTC): document expiry + health + AI suggestions + push dispatch
        Weekly  (Sunday 03:30 UTC / 09:00 IST): vault summary per user
        Monthly (1st 03:30 UTC / 09:00 IST): AI monthly report per user

    Started from FastAPI startup event in main.py alongside SyncScheduler.
    Stopped cleanly on shutdown via the stop() method.

Deduplication guard:
    NotificationEngine.create_notification() already deduplicates at the DB level
    using a 24-hour cutoff window. The scheduler itself also tracks last-run
    timestamps so it never triggers the same job twice in the same window.
"""

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.services.notification_engine import NotificationEngine
from app.services.notification_service import NotificationManager
from app.services.push_service import ExpoPushService

logger = logging.getLogger(__name__)

# ─── Interval constants ───────────────────────────────────────────────────────

LOOP_SLEEP_SECONDS = 60        # Tick resolution: check jobs every 60 s
DAILY_INTERVAL_SECONDS = 86_400
WEEKLY_INTERVAL_SECONDS = 7 * DAILY_INTERVAL_SECONDS
MONTHLY_INTERVAL_SECONDS = 30 * DAILY_INTERVAL_SECONDS  # approx; re-check handles edge cases


class NotificationScheduler:
    """
    Background scheduler that runs notification generation jobs on a daemon thread.

    Usage (in main.py startup event):
        scheduler = NotificationScheduler(DATABASE_URL)
        scheduler.start()

    On shutdown:
        scheduler.stop()
    """

    def __init__(self, db_url: str) -> None:
        self.db_url = db_url
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

        # Last-run timestamps (UTC epoch seconds) for each job
        self._last_daily: float = 0.0
        self._last_weekly: float = 0.0
        self._last_monthly: float = 0.0

    # ── Session factory ───────────────────────────────────────────────────────

    def _make_session(self) -> Session:
        engine = create_engine(
            self.db_url,
            pool_pre_ping=True,
            pool_size=2,
            max_overflow=2,
        )
        LocalSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return LocalSession()

    # ── Job implementations ───────────────────────────────────────────────────

    def _run_daily_job(self) -> None:
        """
        Daily notification generation:
            1. Document expiry milestones
            2. Document health issues
            3. AI suggestion nudges
            4. Dispatch pending push notifications
        """
        logger.info("[NotificationScheduler] Starting daily job...")
        db = self._make_session()
        engine = NotificationEngine()
        manager = NotificationManager()
        push = ExpoPushService()

        try:
            expiry_count = engine.generate_expiry_notifications(db)
            logger.info("[NotificationScheduler] Daily — expiry notifications: %d", expiry_count)

            health_count = engine.generate_document_health_notifications(db)
            logger.info("[NotificationScheduler] Daily — health notifications: %d", health_count)

            ai_count = engine.generate_ai_notifications(db)
            logger.info("[NotificationScheduler] Daily — AI notifications: %d", ai_count)

            pushed = push.dispatch_pending(db, manager)
            logger.info("[NotificationScheduler] Daily — push dispatched: %d", pushed)

        except Exception as exc:
            logger.error("[NotificationScheduler] Daily job failed: %s", exc, exc_info=True)
        finally:
            db.close()
            push.close()

    def _run_weekly_job(self) -> None:
        """
        Weekly notification generation: vault summary per user.
        Runs on Sunday. If the scheduler was down on Sunday, it will run on
        the next check that is at least 7 days after the last weekly run.
        """
        logger.info("[NotificationScheduler] Starting weekly job...")
        db = self._make_session()
        engine = NotificationEngine()
        manager = NotificationManager()
        push = ExpoPushService()

        try:
            count = engine.generate_weekly_summary(db)
            logger.info("[NotificationScheduler] Weekly — summary notifications: %d", count)

            pushed = push.dispatch_pending(db, manager)
            logger.info("[NotificationScheduler] Weekly — push dispatched: %d", pushed)

        except Exception as exc:
            logger.error("[NotificationScheduler] Weekly job failed: %s", exc, exc_info=True)
        finally:
            db.close()
            push.close()

    def _run_monthly_job(self) -> None:
        """
        Monthly notification generation: AI health report per user.
        """
        logger.info("[NotificationScheduler] Starting monthly job...")
        db = self._make_session()
        engine = NotificationEngine()
        manager = NotificationManager()
        push = ExpoPushService()

        try:
            count = engine.generate_monthly_report(db)
            logger.info("[NotificationScheduler] Monthly — report notifications: %d", count)

            pushed = push.dispatch_pending(db, manager)
            logger.info("[NotificationScheduler] Monthly — push dispatched: %d", pushed)

        except Exception as exc:
            logger.error("[NotificationScheduler] Monthly job failed: %s", exc, exc_info=True)
        finally:
            db.close()
            push.close()

    # ── Scheduling logic ──────────────────────────────────────────────────────

    def _should_run_daily(self, now: datetime) -> bool:
        """Run once per day. Fires at 00:01 UTC or later if the thread was down."""
        elapsed = time.time() - self._last_daily
        return elapsed >= DAILY_INTERVAL_SECONDS

    def _should_run_weekly(self, now: datetime) -> bool:
        """Run once per week on Sunday (weekday == 6)."""
        elapsed = time.time() - self._last_weekly
        return elapsed >= WEEKLY_INTERVAL_SECONDS and now.weekday() == 6

    def _should_run_monthly(self, now: datetime) -> bool:
        """Run on the 1st of each month."""
        elapsed = time.time() - self._last_monthly
        return elapsed >= MONTHLY_INTERVAL_SECONDS and now.day == 1

    # ── Main loop ─────────────────────────────────────────────────────────────

    def _run_loop(self) -> None:
        logger.info("[NotificationScheduler] Background loop started.")

        while not self._stop_event.is_set():
            now = datetime.now(timezone.utc)

            if self._should_run_daily(now):
                self._run_daily_job()
                self._last_daily = time.time()

            if self._should_run_weekly(now):
                self._run_weekly_job()
                self._last_weekly = time.time()

            if self._should_run_monthly(now):
                self._run_monthly_job()
                self._last_monthly = time.time()

            # Sleep in small ticks so we can respond to stop() quickly
            self._stop_event.wait(timeout=LOOP_SLEEP_SECONDS)

        logger.info("[NotificationScheduler] Background loop exited.")

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def start(self) -> None:
        """Starts the background scheduler thread. Safe to call multiple times."""
        if self._thread and self._thread.is_alive():
            logger.warning("[NotificationScheduler] Already running — ignoring start() call.")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._run_loop,
            daemon=True,
            name="NotificationScheduler",
        )
        self._thread.start()
        logger.info("[NotificationScheduler] Started (tick interval: %ds).", LOOP_SLEEP_SECONDS)

    def stop(self) -> None:
        """Signals the background thread to stop and waits up to 5 seconds."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("[NotificationScheduler] Stopped.")
