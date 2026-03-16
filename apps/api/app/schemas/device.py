from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import ConnectionAnchor, DeviceNetworkLinkRole, DeviceType
from app.schemas.common import ORMModel, normalize_optional_string, normalize_required_string, trim_string


class DeviceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: DeviceType
    notes: str | None = None
    pos_x: float = 0
    pos_y: float = 0

    _normalize_name = field_validator("name", mode="before")(normalize_required_string)
    _normalize_notes = field_validator("notes", mode="before")(normalize_optional_string)


class DeviceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: DeviceType | None = None
    notes: str | None = None
    pos_x: float | None = None
    pos_y: float | None = None

    _normalize_name = field_validator("name", mode="before")(trim_string)
    _normalize_notes = field_validator("notes", mode="before")(normalize_optional_string)


class DeviceResponse(ORMModel):
    id: UUID
    map_id: UUID
    name: str
    type: DeviceType
    notes: str | None
    pos_x: float
    pos_y: float
    network_ids: list[UUID] = Field(default_factory=list)
    connections: list["DeviceNetworkConnectionResponse"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class DeviceNetworkConnectionUpdate(BaseModel):
    role: DeviceNetworkLinkRole | None = None
    ip_address: str | None = None
    label: str | None = Field(default=None, max_length=120)
    color: str | None = None
    device_anchor: ConnectionAnchor | None = None
    network_anchor: ConnectionAnchor | None = None

    @field_validator("role", mode="before")
    @classmethod
    def reject_null_role(cls, value: object) -> object:
        if value is None:
            raise ValueError("role may not be null")
        return value

    @field_validator("device_anchor", mode="before")
    @classmethod
    def reject_null_device_anchor(cls, value: object) -> object:
        if value is None:
            raise ValueError("device_anchor may not be null")
        return value

    @field_validator("network_anchor", mode="before")
    @classmethod
    def reject_null_network_anchor(cls, value: object) -> object:
        if value is None:
            raise ValueError("network_anchor may not be null")
        return value

    _normalize_ip_address = field_validator("ip_address", mode="before")(normalize_optional_string)
    _normalize_label = field_validator("label", mode="before")(normalize_optional_string)
    _normalize_color = field_validator("color", mode="before")(normalize_optional_string)


class DeviceNetworkConnectionResponse(BaseModel):
    network_id: UUID
    role: DeviceNetworkLinkRole
    ip_address: str | None = None
    label: str | None = None
    color: str | None = None
    device_anchor: ConnectionAnchor
    network_anchor: ConnectionAnchor


DeviceResponse.model_rebuild()
