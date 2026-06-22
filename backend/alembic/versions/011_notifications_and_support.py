"""Add notifications and support chat tables

Revision ID: 011_notifications_and_support
Revises: 010_exchange_rates_and_payment_method_fields
Create Date: 2026-06-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '011_notifications_and_support'
down_revision: Union[str, None] = '010_exchange_rates_and_payment_method_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, name: str) -> bool:
    return name in inspector.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, 'notifications'):
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=64), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('body', sa.Text(), nullable=False, server_default=''),
            sa.Column('data', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('read_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_notification_user_read', 'notifications', ['user_id', 'read_at'])
        op.create_index('idx_notification_user_created', 'notifications', ['user_id', 'created_at'])
        op.create_index(op.f('ix_notifications_type'), 'notifications', ['type'])
        op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'])

    if not _table_exists(inspector, 'support_threads'):
        op.create_table(
            'support_threads',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('athlete_id', sa.Integer(), nullable=False),
            sa.Column('last_message_at', sa.DateTime(), nullable=True),
            sa.Column('last_message_preview', sa.String(length=200), nullable=False, server_default=''),
            sa.Column('unread_for_admin', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('unread_for_athlete', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['athlete_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('athlete_id'),
        )
        op.create_index(op.f('ix_support_threads_athlete_id'), 'support_threads', ['athlete_id'])

    if not _table_exists(inspector, 'support_messages'):
        op.create_table(
            'support_messages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('athlete_id', sa.Integer(), nullable=False),
            sa.Column('sender_id', sa.Integer(), nullable=False),
            sa.Column('sender_role', sa.String(length=20), nullable=False),
            sa.Column('body', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('read_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['athlete_id'], ['users.id']),
            sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_support_message_athlete_created', 'support_messages', ['athlete_id', 'created_at'])
        op.create_index(op.f('ix_support_messages_athlete_id'), 'support_messages', ['athlete_id'])
        op.create_index(op.f('ix_support_messages_sender_id'), 'support_messages', ['sender_id'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, 'support_messages'):
        op.drop_table('support_messages')
    if _table_exists(inspector, 'support_threads'):
        op.drop_table('support_threads')
    if _table_exists(inspector, 'notifications'):
        op.drop_table('notifications')
