"""Add routine structure type and exercise block config

Revision ID: 012_routine_structure
Revises: 011_notifications_and_support
Create Date: 2026-06-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '012_routine_structure'
down_revision: Union[str, None] = '011_notifications_and_support'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(inspector, table: str, column: str) -> bool:
    return column in {col['name'] for col in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _column_exists(inspector, 'routines', 'structure_type'):
        op.add_column(
            'routines',
            sa.Column('structure_type', sa.String(length=32), nullable=False, server_default='standard'),
        )

    if not _column_exists(inspector, 'routine_exercises', 'block_config'):
        op.add_column('routine_exercises', sa.Column('block_config', sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _column_exists(inspector, 'routine_exercises', 'block_config'):
        op.drop_column('routine_exercises', 'block_config')

    if _column_exists(inspector, 'routines', 'structure_type'):
        op.drop_column('routines', 'structure_type')
