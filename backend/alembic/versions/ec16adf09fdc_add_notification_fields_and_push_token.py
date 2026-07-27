"""Add notification fields and push token

Adds all missing columns to the notifications table (category, metadata,
delivery_status, push_sent, push_error, sent_at, read_at, expires_at, updated_at)
and adds expo_push_token to the users table.

Also creates a composite index on (user_id, is_read, created_at) for efficient
paginated list queries.

Revision ID: ec16adf09fdc
Revises: e210a22c5db0
Create Date: 2026-07-25 08:38:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "ec16adf09fdc"
down_revision: Union[str, None] = "e210a22c5db0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── notifications table ──────────────────────────────────────────────────

    # Add category column (DOCUMENT, SCHEME, SECURITY, AI, UPLOAD, SUMMARY, GENERAL)
    op.add_column(
        "notifications",
        sa.Column(
            "category",
            sa.String(length=50),
            nullable=False,
            server_default="GENERAL",
        ),
    )

    # Add JSONB payload for deep-link hints and extra context
    op.add_column(
        "notifications",
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # Rename priority default to LOW and make sure the column exists with correct length
    # (original schema already has priority; we just need updated_at, sent_at, etc.)
    op.add_column(
        "notifications",
        sa.Column(
            "delivery_status",
            sa.String(length=20),
            nullable=False,
            server_default="PENDING",
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "push_sent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "push_error",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "read_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Composite index for the main notifications list query
    op.create_index(
        "ix_notifications_user_read_created",
        "notifications",
        ["user_id", "is_read", "created_at"],
        unique=False,
    )

    # ── users table ──────────────────────────────────────────────────────────
    op.add_column(
        "users",
        sa.Column(
            "expo_push_token",
            sa.String(length=200),
            nullable=True,
        ),
    )


def downgrade() -> None:
    # ── users table ──────────────────────────────────────────────────────────
    op.drop_column("users", "expo_push_token")

    # ── notifications table ──────────────────────────────────────────────────
    op.drop_index(
        "ix_notifications_user_read_created",
        table_name="notifications",
    )
    op.drop_column("notifications", "updated_at")
    op.drop_column("notifications", "expires_at")
    op.drop_column("notifications", "read_at")
    op.drop_column("notifications", "sent_at")
    op.drop_column("notifications", "push_error")
    op.drop_column("notifications", "push_sent")
    op.drop_column("notifications", "delivery_status")
    op.drop_column("notifications", "payload")
    op.drop_column("notifications", "category")
