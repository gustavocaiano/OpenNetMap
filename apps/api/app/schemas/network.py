from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import NetworkKind, NetworkLayoutMode, ScanJobStatus
from app.schemas.common import ORMModel, normalize_optional_string, normalize_required_string, trim_string
from app.services.validators import validate_ipv4_address


class NetworkCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    cidr: str
    vlan_tag: int | None = Field(default=None, ge=1, le=4094)
    notes: str | None = None
    network_kind: NetworkKind = NetworkKind.segment
    layout_mode: NetworkLayoutMode = NetworkLayoutMode.container
    dhcp_enabled: bool = False
    gateway_ip: str | None = None
    dns_servers: list[str] = Field(default_factory=list)
    color: str | None = None
    pos_x: float = 0
    pos_y: float = 0

    _normalize_name = field_validator("name", mode="before")(normalize_required_string)
    _normalize_notes = field_validator("notes", mode="before")(normalize_optional_string)
    _normalize_color = field_validator("color", mode="before")(normalize_optional_string)
    _normalize_gateway_ip = field_validator("gateway_ip", mode="before")(normalize_optional_string)

    @field_validator("layout_mode", mode="before")
    @classmethod
    def reject_null_layout_mode(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be 'node' or 'container'")
        return value

    @field_validator("network_kind", mode="before")
    @classmethod
    def reject_null_network_kind(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be 'segment' or 'link'")
        return value

    @field_validator("gateway_ip")
    @classmethod
    def validate_gateway_ip(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_ipv4_address(value)

    @field_validator("dns_servers", mode="before")
    @classmethod
    def reject_null_dns_servers(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be a valid list")
        return value

    @field_validator("dns_servers")
    @classmethod
    def validate_dns_servers(cls, value: list[str]) -> list[str]:
        return [validate_ipv4_address(server) for server in value]


class NetworkUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    cidr: str | None = None
    vlan_tag: int | None = Field(default=None, ge=1, le=4094)
    notes: str | None = None
    network_kind: NetworkKind | None = None
    layout_mode: NetworkLayoutMode | None = None
    dhcp_enabled: bool | None = None
    gateway_ip: str | None = None
    dns_servers: list[str] | None = None
    color: str | None = None
    pos_x: float | None = None
    pos_y: float | None = None

    _normalize_name = field_validator("name", mode="before")(trim_string)
    _normalize_notes = field_validator("notes", mode="before")(normalize_optional_string)
    _normalize_color = field_validator("color", mode="before")(normalize_optional_string)
    _normalize_gateway_ip = field_validator("gateway_ip", mode="before")(normalize_optional_string)

    @field_validator("layout_mode", mode="before")
    @classmethod
    def reject_null_layout_mode(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be 'node' or 'container'")
        return value

    @field_validator("network_kind", mode="before")
    @classmethod
    def reject_null_network_kind(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be 'segment' or 'link'")
        return value

    @field_validator("dhcp_enabled", mode="before")
    @classmethod
    def reject_null_dhcp_enabled(cls, value: object) -> object:
        if value is None:
            raise ValueError("Input should be a valid boolean")
        return value

    @field_validator("gateway_ip")
    @classmethod
    def validate_gateway_ip(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_ipv4_address(value)

    @field_validator("dns_servers")
    @classmethod
    def validate_dns_servers(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            raise ValueError("Input should be a valid list")
        return [validate_ipv4_address(server) for server in value]


class LatestScanJobSummary(BaseModel):
    id: UUID
    status: ScanJobStatus
    created_at: datetime
    finished_at: datetime | None
    hosts_found_count: int


class NetworkResponse(ORMModel):
    id: UUID
    map_id: UUID
    name: str
    cidr: str
    vlan_tag: int | None
    notes: str | None
    network_kind: NetworkKind
    layout_mode: NetworkLayoutMode
    dhcp_enabled: bool
    gateway_ip: str | None
    dns_servers: list[str] = Field(default_factory=list)
    color: str | None
    pos_x: float
    pos_y: float
    device_ids: list[UUID] = Field(default_factory=list)
    host_count: int
    latest_scan_job: LatestScanJobSummary | None = None
    created_at: datetime
    updated_at: datetime
