"""create users table

Revision ID: 001
Revises:
Create Date: 2026-07-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("firebase_uid", sa.String(128), unique=True, nullable=False),
        sa.Column("mobile_number", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(120), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(20), nullable=True),
        sa.Column("state", sa.String(80), nullable=True),
        sa.Column("district", sa.String(80), nullable=True),
        sa.Column("occupation", sa.String(80), nullable=True),
        sa.Column("annual_income", sa.String(50), nullable=True),
        sa.Column(
            "profile_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "onboarding_permissions_seen",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "aadhaar_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Indexes for common lookup patterns
    op.create_index("idx_users_firebase_uid", "users", ["firebase_uid"], unique=True)
    op.create_index("idx_users_mobile_number", "users", ["mobile_number"])


def downgrade() -> None:
    op.drop_index("idx_users_mobile_number", table_name="users")
    op.drop_index("idx_users_firebase_uid", table_name="users")
    op.drop_table("users")
