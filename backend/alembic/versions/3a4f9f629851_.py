"""empty message

Revision ID: 3a4f9f629851
Revises: b969a3c6e171, e210a22c5db0
Create Date: 2026-07-25 14:12:42.115916

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a4f9f629851'
down_revision: Union[str, None] = ('b969a3c6e171', 'e210a22c5db0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
