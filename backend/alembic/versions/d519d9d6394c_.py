"""empty message

Revision ID: d519d9d6394c
Revises: 8941781505aa, eff1f46d9fd6
Create Date: 2026-08-03 11:23:56.976518

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd519d9d6394c'
down_revision: Union[str, None] = ('8941781505aa', 'eff1f46d9fd6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
