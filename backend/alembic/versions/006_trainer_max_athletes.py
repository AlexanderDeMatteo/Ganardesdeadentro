"""Add max_athletes to user_profiles

Revision ID: 006_trainer_max_athletes
Revises: 005_invitation_tokens
Create Date: 2026-06-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '006_trainer_max_athletes'
down_revision: Union[str, None] = '005_invitation_tokens'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'user_profiles',
        sa.Column('max_athletes', sa.Integer(), nullable=True, server_default='10'),
    )


def downgrade() -> None:
    op.drop_column('user_profiles', 'max_athletes')
