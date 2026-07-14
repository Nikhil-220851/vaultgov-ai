"""create documents table

Revision ID: 002
Revises: 001
Create Date: 2026-07-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column(
            "tags",
            JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("image_uri", sa.Text(), nullable=True),
        sa.Column(
            "source",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'camera'"),
        ),
        sa.Column("confidence_score", sa.Float(), nullable=True),
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

    # Index for the primary access pattern: list documents by user, newest first
    op.create_index("idx_documents_user_id", "documents", ["user_id"])
    op.create_index(
        "idx_documents_user_id_created_at",
        "documents",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_documents_user_id_created_at", table_name="documents")
    op.drop_index("idx_documents_user_id", table_name="documents")
    op.drop_table("documents")
