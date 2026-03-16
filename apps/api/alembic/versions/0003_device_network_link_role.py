"""add device-network link role

Revision ID: 0003_device_network_link_role
Revises: 0002_manual_mapping_metadata
Create Date: 2026-03-16 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_device_network_link_role"
down_revision = "0002_manual_mapping_metadata"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "device_network_links",
        sa.Column("role", sa.String(length=20), nullable=False, server_default=sa.text("'member'")),
    )
    op.create_check_constraint(
        "ck_device_network_links_role", "device_network_links", "role IN ('origin', 'member')"
    )


def downgrade() -> None:
    op.drop_constraint("ck_device_network_links_role", "device_network_links", type_="check")
    op.drop_column("device_network_links", "role")
