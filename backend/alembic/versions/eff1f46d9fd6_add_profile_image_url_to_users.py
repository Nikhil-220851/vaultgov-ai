"""add_profile_image_url_to_users

Revision ID: eff1f46d9fd6
Revises: df6c1409ca1b
Create Date: 2026-07-28 15:12:52.726370

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'eff1f46d9fd6'
down_revision: Union[str, None] = 'df6c1409ca1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'profile_image_url')
