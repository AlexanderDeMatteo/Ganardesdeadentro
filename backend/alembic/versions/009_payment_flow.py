"""Add payment methods and membership payment requests

Revision ID: 009_payment_flow
Revises: 008_custom_exercises
Create Date: 2026-06-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '009_payment_flow'
down_revision: Union[str, None] = '008_custom_exercises'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, name: str) -> bool:
    return name in inspector.get_table_names()


def _column_names(inspector, table: str) -> set[str]:
    return {column['name'] for column in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, 'user_profiles'):
        profile_columns = _column_names(inspector, 'user_profiles')
        if 'phone' not in profile_columns:
            op.add_column('user_profiles', sa.Column('phone', sa.String(length=40), nullable=True))
        if 'country' not in profile_columns:
            op.add_column('user_profiles', sa.Column('country', sa.String(length=80), nullable=True))
        if 'seller_code' not in profile_columns:
            op.add_column('user_profiles', sa.Column('seller_code', sa.String(length=80), nullable=True))

    if not _table_exists(inspector, 'payment_methods'):
        op.create_table(
            'payment_methods',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=120), nullable=False),
            sa.Column('slug', sa.String(length=120), nullable=False),
            sa.Column('category', sa.String(length=120), nullable=False, server_default=''),
            sa.Column('instructions', sa.Text(), nullable=False, server_default=''),
            sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('slug'),
        )
        op.create_index('ix_payment_methods_slug', 'payment_methods', ['slug'], unique=True)

    inspector = sa.inspect(bind)
    if not _table_exists(inspector, 'membership_payment_requests'):
        op.create_table(
            'membership_payment_requests',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('membership_id', sa.Integer(), nullable=False),
            sa.Column('payment_method_id', sa.Integer(), nullable=False),
            sa.Column('full_name', sa.String(length=200), nullable=False),
            sa.Column('phone', sa.String(length=40), nullable=False),
            sa.Column('country', sa.String(length=80), nullable=False),
            sa.Column('seller_code', sa.String(length=80), nullable=True),
            sa.Column('email', sa.String(length=120), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False, server_default='0'),
            sa.Column('receipt_path', sa.String(length=512), nullable=False),
            sa.Column('receipt_mime', sa.String(length=80), nullable=False),
            sa.Column('receipt_size', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('reviewed_by', sa.Integer(), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['membership_id'], ['memberships.id']),
            sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id']),
            sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(
            'idx_payment_request_status_created',
            'membership_payment_requests',
            ['status', 'created_at'],
        )
        op.create_index(
            'idx_payment_request_user_status',
            'membership_payment_requests',
            ['user_id', 'status'],
        )
        op.create_index('ix_membership_payment_requests_user_id', 'membership_payment_requests', ['user_id'])
        op.create_index(
            'ix_membership_payment_requests_membership_id',
            'membership_payment_requests',
            ['membership_id'],
        )
        op.create_index(
            'ix_membership_payment_requests_payment_method_id',
            'membership_payment_requests',
            ['payment_method_id'],
        )
        op.create_index('ix_membership_payment_requests_status', 'membership_payment_requests', ['status'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, 'membership_payment_requests'):
        op.drop_index('ix_membership_payment_requests_status', table_name='membership_payment_requests')
        op.drop_index(
            'ix_membership_payment_requests_payment_method_id',
            table_name='membership_payment_requests',
        )
        op.drop_index(
            'ix_membership_payment_requests_membership_id',
            table_name='membership_payment_requests',
        )
        op.drop_index('ix_membership_payment_requests_user_id', table_name='membership_payment_requests')
        op.drop_index('idx_payment_request_user_status', table_name='membership_payment_requests')
        op.drop_index('idx_payment_request_status_created', table_name='membership_payment_requests')
        op.drop_table('membership_payment_requests')

    if _table_exists(inspector, 'payment_methods'):
        op.drop_index('ix_payment_methods_slug', table_name='payment_methods')
        op.drop_table('payment_methods')

    if _table_exists(inspector, 'user_profiles'):
        profile_columns = _column_names(inspector, 'user_profiles')
        if 'seller_code' in profile_columns:
            op.drop_column('user_profiles', 'seller_code')
        if 'country' in profile_columns:
            op.drop_column('user_profiles', 'country')
        if 'phone' in profile_columns:
            op.drop_column('user_profiles', 'phone')
