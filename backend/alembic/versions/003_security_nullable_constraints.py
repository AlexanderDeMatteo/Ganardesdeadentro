"""Harden nullable flags and routine ownership constraint

Revision ID: 003_security_nullable
Revises: 002_routines_admin_nullable
Create Date: 2026-06-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '003_security_nullable'
down_revision: Union[str, None] = '002_routines_admin_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET is_active = 1 WHERE is_active IS NULL")
    op.execute("UPDATE routines SET is_active = 1 WHERE is_active IS NULL")

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('is_active', existing_type=sa.Boolean(), nullable=False)

    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.alter_column('is_active', existing_type=sa.Boolean(), nullable=False)
        batch_op.create_check_constraint(
            'ck_routine_owner_present',
            'admin_id IS NOT NULL OR trainer_id IS NOT NULL',
        )


def downgrade() -> None:
    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.drop_constraint('ck_routine_owner_present', type_='check')
        batch_op.alter_column('is_active', existing_type=sa.Boolean(), nullable=True)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('is_active', existing_type=sa.Boolean(), nullable=True)
