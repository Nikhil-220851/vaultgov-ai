"""extend schemes table and add audit log

Revision ID: d1e2f3a4b5c6
Revises: c6e597b3ab16
Create Date: 2026-07-15

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c6e597b3ab16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Add new columns to schemes table ────────────────────────────────────────
    op.add_column('schemes', sa.Column('education', sa.String(100), nullable=False, server_default='Any'))
    op.add_column('schemes', sa.Column('content_hash', sa.String(64), nullable=True))
    op.add_column('schemes', sa.Column('source_name', sa.String(255), nullable=True))
    op.add_column('schemes', sa.Column('source_url', sa.String(500), nullable=True))
    op.add_column('schemes', sa.Column('verified_by', sa.String(100), nullable=True))
    op.add_column('schemes', sa.Column('verification_date', sa.String(50), nullable=True))

    # ── Create scheme_audit_log table ────────────────────────────────────────────
    op.create_table(
        'scheme_audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('scheme_id', sa.String(100), nullable=False, index=True),
        sa.Column('admin_uid', sa.String(128), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('timestamp', sa.String(50), nullable=False),
        sa.Column('previous_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('updated_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index('ix_audit_log_scheme_id', 'scheme_audit_log', ['scheme_id'])
    op.create_index('ix_audit_log_admin_uid', 'scheme_audit_log', ['admin_uid'])


def downgrade() -> None:
    op.drop_index('ix_audit_log_admin_uid', table_name='scheme_audit_log')
    op.drop_index('ix_audit_log_scheme_id', table_name='scheme_audit_log')
    op.drop_table('scheme_audit_log')
    op.drop_column('schemes', 'verification_date')
    op.drop_column('schemes', 'verified_by')
    op.drop_column('schemes', 'source_url')
    op.drop_column('schemes', 'source_name')
    op.drop_column('schemes', 'content_hash')
    op.drop_column('schemes', 'education')
