from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, CheckConstraint, Float, ForeignKey, Integer, String, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.enums import NetworkKind, NetworkLayoutMode
from app.models.map import utcnow
from app.db.base import Base
from app.db.types import IPv4CIDRType, IPv4InetType


class Network(Base):
    __tablename__ = "networks"
    __table_args__ = (
        UniqueConstraint("map_id", "cidr", name="uq_networks_map_id_cidr"),
        CheckConstraint("vlan_tag BETWEEN 1 AND 4094", name="ck_networks_vlan_tag_range"),
        CheckConstraint("layout_mode IN ('node', 'container')", name="ck_networks_layout_mode"),
        CheckConstraint("network_kind IN ('segment', 'link')", name="ck_networks_network_kind"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    map_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("network_maps.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    cidr: Mapped[str] = mapped_column(IPv4CIDRType(), nullable=False)
    vlan_tag: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    network_kind: Mapped[str] = mapped_column(String(20), nullable=False, default=NetworkKind.segment.value)
    layout_mode: Mapped[str] = mapped_column(String(20), nullable=False, default=NetworkLayoutMode.container.value)
    dhcp_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    gateway_ip: Mapped[str | None] = mapped_column(IPv4InetType(), nullable=True)
    dns_servers: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pos_x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    pos_y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    map: Mapped["NetworkMap"] = relationship("NetworkMap", back_populates="networks")
    device_links: Mapped[list["DeviceNetworkLink"]] = relationship(
        "DeviceNetworkLink", back_populates="network", cascade="all, delete-orphan"
    )
    hosts: Mapped[list["Host"]] = relationship("Host", back_populates="network", cascade="all, delete-orphan")
    scan_jobs: Mapped[list["ScanJob"]] = relationship("ScanJob", back_populates="network", cascade="all, delete-orphan")
