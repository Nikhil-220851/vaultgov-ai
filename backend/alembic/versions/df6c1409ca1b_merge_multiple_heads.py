"""Merge multiple heads

Revision ID: df6c1409ca1b
Revises: b969a3c6e171, ec16adf09fdc
Create Date: 2026-07-25 15:11:47.682964

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df6c1409ca1b'
down_revision: Union[str, None] = ('b969a3c6e171', 'ec16adf09fdc')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
