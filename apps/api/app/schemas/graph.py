from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ConnectionAnchor, DeviceNetworkLinkRole
from app.schemas.device import DeviceResponse
from app.schemas.host import HostResponse
from app.schemas.map import MapResponse
from app.schemas.network import NetworkResponse


class DeviceNetworkLinkResponse(BaseModel):
    device_id: UUID
    network_id: UUID
    role: DeviceNetworkLinkRole
    ip_address: str | None = None
    label: str | None = None
    color: str | None = None
    device_anchor: ConnectionAnchor
    network_anchor: ConnectionAnchor


class GraphResponse(BaseModel):
    map: MapResponse
    devices: list[DeviceResponse]
    networks: list[NetworkResponse]
    hosts: list[HostResponse]
    device_network_links: list[DeviceNetworkLinkResponse]
