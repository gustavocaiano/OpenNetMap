from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class NetworkMap(Base):
    __tablename__ = "network_maps"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    devices: Mapped[list["Device"]] = relationship("Device", back_populates="map", cascade="all, delete-orphan")
    networks: Mapped[list["Network"]] = relationship("Network", back_populates="map", cascade="all, delete-orphan")
