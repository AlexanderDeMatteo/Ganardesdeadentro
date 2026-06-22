"""Add exchange rates and structured payment method fields

Revision ID: 010_exchange_rates_and_payment_method_fields
Revises: 009_payment_flow
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '010_exchange_rates_and_payment_method_fields'
down_revision: Union[str, None] = '009_payment_flow'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, name: str) -> bool:
    return name in inspector.get_table_names()


def _column_names(inspector, table: str) -> set[str]:
    return {column['name'] for column in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _table_exists(inspector, 'exchange_rates'):
        op.create_table(
            'exchange_rates',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('from_currency', sa.String(length=3), nullable=False, server_default='USD'),
            sa.Column('to_currency', sa.String(length=3), nullable=False, server_default='VES'),
            sa.Column('rate', sa.Float(), nullable=False, server_default='1'),
            sa.Column('label', sa.String(length=80), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(
            'idx_exchange_rate_pair_active',
            'exchange_rates',
            ['from_currency', 'to_currency', 'is_active'],
            unique=False,
        )

    inspector = sa.inspect(bind)
    if _table_exists(inspector, 'payment_methods'):
        columns = _column_names(inspector, 'payment_methods')
        if 'method_type' not in columns:
            op.add_column(
                'payment_methods',
                sa.Column('method_type', sa.String(length=20), nullable=False, server_default='digital'),
            )
        if 'exchange_rate_id' not in columns:
            op.add_column(
                'payment_methods',
                sa.Column('exchange_rate_id', sa.Integer(), nullable=True),
            )
            op.create_foreign_key(
                'fk_payment_methods_exchange_rate_id',
                'payment_methods',
                'exchange_rates',
                ['exchange_rate_id'],
                ['id'],
            )
            op.create_index(
                'ix_payment_methods_exchange_rate_id',
                'payment_methods',
                ['exchange_rate_id'],
                unique=False,
            )
        if 'details' not in columns:
            op.add_column(
                'payment_methods',
                sa.Column('details', sa.Text(), nullable=False, server_default='[]'),
            )

    if _table_exists(inspector, 'membership_payment_requests'):
        columns = _column_names(inspector, 'membership_payment_requests')
        if 'amount_usd' not in columns:
            op.add_column(
                'membership_payment_requests',
                sa.Column('amount_usd', sa.Float(), nullable=False, server_default='0'),
            )
        if 'amount_converted' not in columns:
            op.add_column('membership_payment_requests', sa.Column('amount_converted', sa.Float(), nullable=True))
        if 'converted_currency' not in columns:
            op.add_column(
                'membership_payment_requests',
                sa.Column('converted_currency', sa.String(length=3), nullable=True),
            )
        if 'exchange_rate_snapshot' not in columns:
            op.add_column(
                'membership_payment_requests',
                sa.Column('exchange_rate_snapshot', sa.Float(), nullable=True),
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, 'membership_payment_requests'):
        columns = _column_names(inspector, 'membership_payment_requests')
        if 'exchange_rate_snapshot' in columns:
            op.drop_column('membership_payment_requests', 'exchange_rate_snapshot')
        if 'converted_currency' in columns:
            op.drop_column('membership_payment_requests', 'converted_currency')
        if 'amount_converted' in columns:
            op.drop_column('membership_payment_requests', 'amount_converted')
        if 'amount_usd' in columns:
            op.drop_column('membership_payment_requests', 'amount_usd')

    if _table_exists(inspector, 'payment_methods'):
        columns = _column_names(inspector, 'payment_methods')
        if 'details' in columns:
            op.drop_column('payment_methods', 'details')
        if 'exchange_rate_id' in columns:
            op.drop_index('ix_payment_methods_exchange_rate_id', table_name='payment_methods')
            op.drop_constraint('fk_payment_methods_exchange_rate_id', 'payment_methods', type_='foreignkey')
            op.drop_column('payment_methods', 'exchange_rate_id')
        if 'method_type' in columns:
            op.drop_column('payment_methods', 'method_type')

    if _table_exists(inspector, 'exchange_rates'):
        op.drop_index('idx_exchange_rate_pair_active', table_name='exchange_rates')
        op.drop_table('exchange_rates')
