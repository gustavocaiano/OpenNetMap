from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Enum, Float, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.enums import DeviceType
from app.models.map import utcnow
from app.db.base import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    map_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("network_maps.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[DeviceType] = mapped_column(Enum(DeviceType, name="device_type"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    pos_x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    pos_y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    map: Mapped["NetworkMap"] = relationship("NetworkMap", back_populates="devices")
    network_links: Mapped[list["DeviceNetworkLink"]] = relationship(
        "DeviceNetworkLink", back_populates="device", cascade="all, delete-orphan"
    )
