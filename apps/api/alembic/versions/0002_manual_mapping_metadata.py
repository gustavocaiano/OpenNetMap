"""add manual mapping metadata

Revision ID: 0002_manual_mapping_metadata
Revises: 0001_initial
Create Date: 2026-03-16 00:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_manual_mapping_metadata"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("device_network_links", sa.Column("ip_address", postgresql.INET(), nullable=True))
    op.add_column("device_network_links", sa.Column("label", sa.String(length=120), nullable=True))
    op.add_column("device_network_links", sa.Column("color", sa.String(length=20), nullable=True))

    op.add_column(
        "networks",
        sa.Column("layout_mode", sa.String(length=20), nullable=False, server_default=sa.text("'container'")),
    )
    op.add_column("networks", sa.Column("color", sa.String(length=20), nullable=True))
    op.create_check_constraint("ck_networks_layout_mode", "networks", "layout_mode IN ('node', 'container')")


def downgrade() -> None:
    op.drop_constraint("ck_networks_layout_mode", "networks", type_="check")
    op.drop_column("networks", "color")
    op.drop_column("networks", "layout_mode")

    op.drop_column("device_network_links", "color")
    op.drop_column("device_network_links", "label")
    op.drop_column("device_network_links", "ip_address")
