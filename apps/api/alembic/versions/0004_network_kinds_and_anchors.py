"""add network kinds lan metadata and anchors

Revision ID: 0004_network_kinds_and_anchors
Revises: 0003_device_network_link_role
Create Date: 2026-03-16 01:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_network_kinds_and_anchors"
down_revision = "0003_device_network_link_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "networks",
        sa.Column("network_kind", sa.String(length=20), nullable=False, server_default=sa.text("'segment'")),
    )
    op.add_column("networks", sa.Column("dhcp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")))
    op.add_column("networks", sa.Column("gateway_ip", postgresql.INET(), nullable=True))
    op.add_column(
        "networks",
        sa.Column("dns_servers", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )
    op.create_check_constraint("ck_networks_network_kind", "networks", "network_kind IN ('segment', 'link')")

    op.add_column(
        "device_network_links",
        sa.Column("device_anchor", sa.String(length=20), nullable=False, server_default=sa.text("'auto'")),
    )
    op.add_column(
        "device_network_links",
        sa.Column("network_anchor", sa.String(length=20), nullable=False, server_default=sa.text("'auto'")),
    )
    op.create_check_constraint(
        "ck_device_network_links_device_anchor",
        "device_network_links",
        "device_anchor IN ('auto', 'top', 'right', 'bottom', 'left')",
    )
    op.create_check_constraint(
        "ck_device_network_links_network_anchor",
        "device_network_links",
        "network_anchor IN ('auto', 'top', 'right', 'bottom', 'left')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_device_network_links_network_anchor", "device_network_links", type_="check")
    op.drop_constraint("ck_device_network_links_device_anchor", "device_network_links", type_="check")
    op.drop_column("device_network_links", "network_anchor")
    op.drop_column("device_network_links", "device_anchor")

    op.drop_constraint("ck_networks_network_kind", "networks", type_="check")
    op.drop_column("networks", "dns_servers")
    op.drop_column("networks", "gateway_ip")
    op.drop_column("networks", "dhcp_enabled")
    op.drop_column("networks", "network_kind")
