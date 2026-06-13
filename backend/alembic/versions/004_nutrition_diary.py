"""Add nutrition_diaries table

Revision ID: 004_nutrition_diary
Revises: 003_security_nullable
Create Date: 2026-06-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '004_nutrition_diary'
down_revision: Union[str, None] = '003_security_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'nutrition_diaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('food_log', sa.Text(), nullable=False, server_default='[]'),
        sa.Column('water_by_date', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('water_goal_ml', sa.Integer(), nullable=False, server_default='2500'),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_nutrition_diaries_user_id', 'nutrition_diaries', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_nutrition_diaries_user_id', table_name='nutrition_diaries')
    op.drop_table('nutrition_diaries')
