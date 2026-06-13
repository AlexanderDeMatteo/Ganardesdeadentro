"""Add invitation_tokens table

Revision ID: 005_invitation_tokens
Revises: 004_nutrition_diary
Create Date: 2026-06-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '005_invitation_tokens'
down_revision: Union[str, None] = '004_nutrition_diary'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invitation_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('purpose', sa.String(length=32), nullable=False, server_default='trainer_invite'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )
    op.create_index('idx_invitation_user_purpose', 'invitation_tokens', ['user_id', 'purpose'])


def downgrade() -> None:
    op.drop_index('idx_invitation_user_purpose', table_name='invitation_tokens')
    op.drop_table('invitation_tokens')
