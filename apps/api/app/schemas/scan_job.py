from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.enums import ScanJobStatus
from app.schemas.common import ORMModel, normalize_required_string


class ScanJobCreate(BaseModel):
    scan_profile: str = "ping_sweep"

    _normalize_scan_profile = field_validator("scan_profile", mode="before")(normalize_required_string)


class ScanJobResponse(ORMModel):
    id: UUID
    network_id: UUID
    status: ScanJobStatus
    scan_profile: str
    hosts_found_count: int
    raw_output_available: bool
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
