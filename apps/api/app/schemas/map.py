from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORMModel, normalize_optional_string, normalize_required_string, trim_string


class MapCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None

    _normalize_name = field_validator("name", mode="before")(normalize_required_string)
    _normalize_description = field_validator("description", mode="before")(normalize_optional_string)


class MapUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None

    _normalize_name = field_validator("name", mode="before")(trim_string)
    _normalize_description = field_validator("description", mode="before")(normalize_optional_string)


class MapResponse(ORMModel):
    id: UUID
    name: str
    description: str | None
    device_count: int
    network_count: int
    host_count: int
    created_at: datetime
    updated_at: datetime
