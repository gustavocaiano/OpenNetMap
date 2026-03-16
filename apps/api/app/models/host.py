from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import IPv4InetType
from app.models.enums import HostDiscoverySource, HostType
from app.models.map import utcnow


class Host(Base):
    __tablename__ = "hosts"
    __table_args__ = (UniqueConstraint("network_id", "ip_address"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    network_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("networks.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(IPv4InetType(), nullable=False)
    hostname: Mapped[str | None] = mapped_column(Text, nullable=True)
    detected_hostname: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[HostType] = mapped_column(Enum(HostType, name="host_type"), nullable=False, default=HostType.unknown)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    discovery_source: Mapped[HostDiscoverySource] = mapped_column(
        Enum(HostDiscoverySource, name="host_discovery_source"), nullable=False, default=HostDiscoverySource.nmap
    )
    needs_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    first_seen_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_scan_job_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("scan_jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    network: Mapped["Network"] = relationship("Network", back_populates="hosts")
    last_scan_job: Mapped["ScanJob | None"] = relationship("ScanJob", back_populates="hosts")
