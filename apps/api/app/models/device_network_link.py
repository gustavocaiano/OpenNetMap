from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.map import utcnow
from app.db.base import Base
from app.db.types import IPv4InetType
from app.models.enums import ConnectionAnchor, DeviceNetworkLinkRole


class DeviceNetworkLink(Base):
    __tablename__ = "device_network_links"
    __table_args__ = (
        Index("ix_device_network_links_network_id", "network_id"),
        CheckConstraint("role IN ('origin', 'member')", name="ck_device_network_links_role"),
        CheckConstraint(
            "device_anchor IN ('auto', 'top', 'right', 'bottom', 'left')",
            name="ck_device_network_links_device_anchor",
        ),
        CheckConstraint(
            "network_anchor IN ('auto', 'top', 'right', 'bottom', 'left')",
            name="ck_device_network_links_network_anchor",
        ),
    )

    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), primary_key=True)
    network_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("networks.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=DeviceNetworkLinkRole.member.value)
    ip_address: Mapped[str | None] = mapped_column(IPv4InetType(), nullable=True)
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    device_anchor: Mapped[str] = mapped_column(String(20), nullable=False, default=ConnectionAnchor.auto.value)
    network_anchor: Mapped[str] = mapped_column(String(20), nullable=False, default=ConnectionAnchor.auto.value)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    device: Mapped["Device"] = relationship("Device", back_populates="network_links")
    network: Mapped["Network"] = relationship("Network", back_populates="device_links")
