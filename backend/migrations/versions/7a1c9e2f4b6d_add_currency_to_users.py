"""Add currency to users

Revision ID: 7a1c9e2f4b6d
Revises: 29d448fe3b2b
Create Date: 2026-08-27 07:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a1c9e2f4b6d'
down_revision = '29d448fe3b2b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='AED')
        )


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('currency')
