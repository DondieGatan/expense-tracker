"""Add password_reset_codes table

Revision ID: 3d8f2a91c7e4
Revises: 7a1c9e2f4b6d
Create Date: 2026-09-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3d8f2a91c7e4'
down_revision = '7a1c9e2f4b6d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'password_reset_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('code_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('password_reset_codes', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_password_reset_codes_user_id'), ['user_id'], unique=False
        )


def downgrade():
    with op.batch_alter_table('password_reset_codes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_password_reset_codes_user_id'))
    op.drop_table('password_reset_codes')
