"""Phase 5 Smart Vault Engine

Revision ID: e210a22c5db0
Revises: d1e2f3a4b5c6
Create Date: 2026-07-23 08:47:09.572370
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e210a22c5db0"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("priority", sa.String(length=50), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_notifications_user_id"),
        "notifications",
        ["user_id"],
        unique=False,
    )

    # Document columns
    op.add_column("documents", sa.Column("health_score", sa.Float(), nullable=True))
    op.add_column("documents", sa.Column("status", sa.String(length=50), nullable=True))
    op.add_column(
        "documents",
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("renewal_priority", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("last_opened_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("status_changed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("supports_expiry", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("notification_enabled", sa.Boolean(), nullable=True),
    )

    # Safe index removal
    op.execute("DROP INDEX IF EXISTS ix_audit_log_admin_uid")
    op.execute("DROP INDEX IF EXISTS ix_audit_log_scheme_id")

    op.execute("CREATE INDEX IF NOT EXISTS ix_scheme_audit_log_admin_uid ON scheme_audit_log (admin_uid)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_scheme_audit_log_scheme_id ON scheme_audit_log (scheme_id)")

    # Alter column
    op.alter_column(
        "schemes",
        "official_notification",
        existing_type=sa.VARCHAR(length=255),
        type_=sa.String(length=500),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "schemes",
        "official_notification",
        existing_type=sa.String(length=500),
        type_=sa.VARCHAR(length=255),
        existing_nullable=True,
    )

    op.drop_column("documents", "notification_enabled")
    op.drop_column("documents", "supports_expiry")
    op.drop_column("documents", "status_changed_at")
    op.drop_column("documents", "validated_at")
    op.drop_column("documents", "last_opened_at")
    op.drop_column("documents", "renewal_priority")
    op.drop_column("documents", "expiry_date")
    op.drop_column("documents", "status")
    op.drop_column("documents", "health_score")

    op.drop_index(
        op.f("ix_notifications_user_id"),
        table_name="notifications",
    )

    op.drop_table("notifications")