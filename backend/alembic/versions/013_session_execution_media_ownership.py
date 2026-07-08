"""Add ownership metadata for session execution media

Revision ID: 013_session_media_ownership
Revises: 012_routine_structure
Create Date: 2026-07-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '013_session_media_ownership'
down_revision: Union[str, None] = '012_routine_structure'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(inspector, table: str) -> bool:
    return table in set(inspector.get_table_names())


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, 'session_execution_media'):
        return

    op.create_table(
        'session_execution_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('athlete_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['athlete_id'], ['users.id']),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_session_execution_media_filename', 'session_execution_media', ['filename'], unique=True)
    op.create_index('ix_session_execution_media_athlete_id', 'session_execution_media', ['athlete_id'])
    op.create_index('ix_session_execution_media_uploaded_by_id', 'session_execution_media', ['uploaded_by_id'])
    op.create_index(
        'idx_session_media_athlete_created',
        'session_execution_media',
        ['athlete_id', 'created_at'],
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not _table_exists(inspector, 'session_execution_media'):
        return

    op.drop_index('idx_session_media_athlete_created', table_name='session_execution_media')
    op.drop_index('ix_session_execution_media_uploaded_by_id', table_name='session_execution_media')
    op.drop_index('ix_session_execution_media_athlete_id', table_name='session_execution_media')
    op.drop_index('ix_session_execution_media_filename', table_name='session_execution_media')
    op.drop_table('session_execution_media')
