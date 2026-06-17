"""Add custom exercise fields and animation metadata

Revision ID: 008_custom_exercises
Revises: 007_membership_functional_tier
Create Date: 2026-06-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '008_custom_exercises'
down_revision: Union[str, None] = '007_membership_functional_tier'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('exercises', sa.Column('is_custom', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('exercises', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('exercises', sa.Column('created_by_id', sa.Integer(), nullable=True))
    op.add_column('exercises', sa.Column('animation_type', sa.String(length=20), nullable=False, server_default='none'))
    op.add_column('exercises', sa.Column('animation_source', sa.String(length=20), nullable=False, server_default='none'))
    op.add_column('exercises', sa.Column('animation_url', sa.String(length=512), nullable=True))
    op.create_foreign_key('fk_exercises_created_by_id', 'exercises', 'users', ['created_by_id'], ['id'])
    op.create_index('idx_exercise_custom_active', 'exercises', ['is_custom', 'is_active', 'name'])


def downgrade() -> None:
    op.drop_index('idx_exercise_custom_active', table_name='exercises')
    op.drop_constraint('fk_exercises_created_by_id', 'exercises', type_='foreignkey')
    op.drop_column('exercises', 'animation_url')
    op.drop_column('exercises', 'animation_source')
    op.drop_column('exercises', 'animation_type')
    op.drop_column('exercises', 'created_by_id')
    op.drop_column('exercises', 'is_active')
    op.drop_column('exercises', 'is_custom')
