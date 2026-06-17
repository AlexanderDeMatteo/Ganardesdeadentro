"""Add functional_tier to memberships

Revision ID: 007_membership_functional_tier
Revises: 006_trainer_max_athletes
Create Date: 2026-06-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '007_membership_functional_tier'
down_revision: Union[str, None] = '006_trainer_max_athletes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'memberships',
        sa.Column('functional_tier', sa.String(length=20), nullable=False, server_default='basic'),
    )


def downgrade() -> None:
    op.drop_column('memberships', 'functional_tier')
