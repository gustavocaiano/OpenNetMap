from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.enums import HostDiscoverySource, HostType
from app.schemas.common import ORMModel, normalize_optional_string


class HostUpdate(BaseModel):
    ip_address: str | None = None
    hostname: str | None = None
    type: HostType | None = None
    notes: str | None = None
    needs_review: bool | None = None

    _normalize_ip_address = field_validator("ip_address", mode="before")(normalize_optional_string)
    _normalize_hostname = field_validator("hostname", mode="before")(normalize_optional_string)
    _normalize_notes = field_validator("notes", mode="before")(normalize_optional_string)


class HostResponse(ORMModel):
    id: UUID
    network_id: UUID
    ip_address: str
    hostname: str | None
    detected_hostname: str | None
    type: HostType
    notes: str | None
    discovery_source: HostDiscoverySource
    needs_review: bool
    first_seen_at: datetime
    last_seen_at: datetime
    last_scan_job_id: UUID | None
    created_at: datetime
    updated_at: datetime
