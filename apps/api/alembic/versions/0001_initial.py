"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    device_type = postgresql.ENUM("router", "firewall", "server", name="device_type", create_type=False)
    host_type = postgresql.ENUM("unknown", "server", "vm", "workstation", name="host_type", create_type=False)
    host_discovery_source = postgresql.ENUM("nmap", "manual", name="host_discovery_source", create_type=False)
    scan_job_status = postgresql.ENUM("pending", "running", "succeeded", "failed", name="scan_job_status", create_type=False)

    bind = op.get_bind()
    device_type.create(bind, checkfirst=True)
    host_type.create(bind, checkfirst=True)
    host_discovery_source.create(bind, checkfirst=True)
    scan_job_status.create(bind, checkfirst=True)

    op.create_table(
        "network_maps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )

    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("map_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("network_maps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("type", device_type, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("pos_x", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("pos_y", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_devices_map_id", "devices", ["map_id"])

    op.create_table(
        "networks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("map_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("network_maps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("cidr", postgresql.CIDR(), nullable=False),
        sa.Column("vlan_tag", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("pos_x", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("pos_y", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("vlan_tag BETWEEN 1 AND 4094", name="ck_networks_vlan_tag_range"),
        sa.UniqueConstraint("map_id", "cidr", name="uq_networks_map_id_cidr"),
    )
    op.create_index("ix_networks_map_id", "networks", ["map_id"])

    op.create_table(
        "device_network_links",
        sa.Column("device_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("devices.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("networks.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_device_network_links_network_id", "device_network_links", ["network_id"])

    op.create_table(
        "scan_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", scan_job_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("scan_profile", sa.String(length=50), nullable=False, server_default=sa.text("'ping_sweep'")),
        sa.Column("hosts_found_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("raw_output_path", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("scan_profile IN ('ping_sweep')", name="ck_scan_jobs_scan_profile"),
        sa.CheckConstraint("hosts_found_count >= 0", name="ck_scan_jobs_hosts_found_count_nonnegative"),
    )
    op.create_index("ix_scan_jobs_network_id", "scan_jobs", ["network_id"])
    op.create_index("ix_scan_jobs_status", "scan_jobs", ["status"])
    op.execute(
        "CREATE UNIQUE INDEX uq_scan_jobs_active_per_network ON scan_jobs (network_id) WHERE status IN ('pending', 'running')"
    )

    op.create_table(
        "hosts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=False),
        sa.Column("hostname", sa.String(length=255), nullable=True),
        sa.Column("detected_hostname", sa.String(length=255), nullable=True),
        sa.Column("type", host_type, nullable=False, server_default=sa.text("'unknown'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("discovery_source", host_discovery_source, nullable=False, server_default=sa.text("'nmap'")),
        sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_scan_job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scan_jobs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("network_id", "ip_address", name="uq_hosts_network_id_ip_address"),
    )
    op.create_index("ix_hosts_network_id", "hosts", ["network_id"])
    op.create_index("ix_hosts_last_scan_job_id", "hosts", ["last_scan_job_id"])


def downgrade() -> None:
    op.drop_table("hosts")
    op.drop_index("uq_scan_jobs_active_per_network", table_name="scan_jobs")
    op.drop_table("scan_jobs")
    op.drop_index("ix_device_network_links_network_id", table_name="device_network_links")
    op.drop_table("device_network_links")
    op.drop_table("networks")
    op.drop_table("devices")
    op.drop_table("network_maps")
    bind = op.get_bind()
    postgresql.ENUM(name="scan_job_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="host_discovery_source").drop(bind, checkfirst=True)
    postgresql.ENUM(name="host_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="device_type").drop(bind, checkfirst=True)
