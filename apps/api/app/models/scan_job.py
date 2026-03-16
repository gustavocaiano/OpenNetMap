from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Integer, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ScanJobStatus
from app.models.map import utcnow


class ScanJob(Base):
    __tablename__ = "scan_jobs"
    __table_args__ = (CheckConstraint("hosts_found_count >= 0", name="ck_scan_jobs_hosts_found_count_nonnegative"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    network_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("networks.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[ScanJobStatus] = mapped_column(
        Enum(ScanJobStatus, name="scan_job_status"), nullable=False, index=True, default=ScanJobStatus.pending
    )
    scan_profile: Mapped[str] = mapped_column(Text, nullable=False, default="ping_sweep")
    hosts_found_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    raw_output_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, nullable=False)

    network: Mapped["Network"] = relationship("Network", back_populates="scan_jobs")
    hosts: Mapped[list["Host"]] = relationship("Host", back_populates="last_scan_job")
