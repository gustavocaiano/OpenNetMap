from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.error_handlers import api_error
from app.models import Device, DeviceNetworkLink, Network
from app.models.enums import ConnectionAnchor, DeviceNetworkLinkRole
from app.schemas.device import (
    DeviceCreate,
    DeviceNetworkConnectionResponse,
    DeviceNetworkConnectionUpdate,
    DeviceResponse,
    DeviceUpdate,
)
from app.services.map_service import require_map
from app.services.validators import ensure_device_link_ip_in_network, validate_hex_color


def _link_to_connection_response(link: DeviceNetworkLink) -> DeviceNetworkConnectionResponse:
    return DeviceNetworkConnectionResponse(
        network_id=link.network_id,
        role=link.role,
        ip_address=str(link.ip_address) if link.ip_address is not None else None,
        label=link.label,
        color=link.color,
        device_anchor=link.device_anchor,
        network_anchor=link.network_anchor,
    )


def _to_response(device: Device) -> DeviceResponse:
    sorted_links = sorted(device.network_links, key=lambda item: str(item.network_id))
    network_ids = [link.network_id for link in sorted_links]
    return DeviceResponse(
        id=device.id,
        map_id=device.map_id,
        name=device.name,
        type=device.type,
        notes=device.notes,
        pos_x=device.pos_x,
        pos_y=device.pos_y,
        network_ids=network_ids,
        connections=[_link_to_connection_response(link) for link in sorted_links],
        created_at=device.created_at,
        updated_at=device.updated_at,
    )


def require_device(db: Session, device_id: UUID) -> Device:
    device = db.execute(
        select(Device)
        .options(joinedload(Device.network_links))
        .where(Device.id == device_id)
        .execution_options(populate_existing=True)
    ).unique().scalar_one_or_none()
    if not device:
        raise api_error(404, "device_not_found", "Device not found")
    return device


def list_devices_for_map(db: Session, map_id: UUID) -> list[DeviceResponse]:
    require_map(db, map_id)
    devices = db.scalars(
        select(Device).options(joinedload(Device.network_links)).where(Device.map_id == map_id).order_by(Device.name)
    ).unique().all()
    return [_to_response(device) for device in devices]


def create_device(db: Session, map_id: UUID, payload: DeviceCreate) -> DeviceResponse:
    require_map(db, map_id)
    device = Device(map_id=map_id, **payload.model_dump())
    db.add(device)
    db.commit()
    return _to_response(require_device(db, device.id))


def update_device(db: Session, device_id: UUID, payload: DeviceUpdate) -> DeviceResponse:
    device = require_device(db, device_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    device.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _to_response(require_device(db, device_id))


def delete_device(db: Session, device_id: UUID) -> None:
    device = require_device(db, device_id)
    db.delete(device)
    db.commit()


def _normalize_link_updates(network: Network, payload: DeviceNetworkConnectionUpdate | None) -> dict[str, object]:
    if payload is None:
        return {}

    updates = payload.model_dump(exclude_unset=True)
    if "role" in updates and updates["role"] is not None:
        updates["role"] = updates["role"].value
    if "ip_address" in updates and updates["ip_address"] is not None:
        ensure_device_link_ip_in_network(updates["ip_address"], network.cidr)
    if "color" in updates and updates["color"] is not None:
        updates["color"] = validate_hex_color(updates["color"])
    for anchor_field in ("device_anchor", "network_anchor"):
        if anchor_field in updates and updates[anchor_field] is not None:
            updates[anchor_field] = updates[anchor_field].value
    return updates


def _network_has_origin_link(db: Session, network_id: UUID) -> bool:
    origin_count = db.scalar(
        select(func.count())
        .select_from(DeviceNetworkLink)
        .where(
            DeviceNetworkLink.network_id == network_id,
            DeviceNetworkLink.role == DeviceNetworkLinkRole.origin.value,
        )
    )
    return bool(origin_count)


def link_device_to_network(
    db: Session, device_id: UUID, network_id: UUID, payload: DeviceNetworkConnectionUpdate | None = None
) -> None:
    device = require_device(db, device_id)
    network = db.get(Network, network_id)
    if not network:
        raise api_error(404, "network_not_found", "Network not found")
    if device.map_id != network.map_id:
        raise api_error(409, "device_network_map_mismatch", "Device and network must belong to the same map")

    updates = _normalize_link_updates(network, payload)
    link = db.get(DeviceNetworkLink, {"device_id": device_id, "network_id": network_id})
    link_created = link is None
    if not link:
        if "role" not in updates:
            updates["role"] = (
                DeviceNetworkLinkRole.member.value
                if _network_has_origin_link(db, network_id)
                else DeviceNetworkLinkRole.origin.value
            )
        link = DeviceNetworkLink(device_id=device_id, network_id=network_id)
        db.add(link)
        if "device_anchor" not in updates:
            updates["device_anchor"] = ConnectionAnchor.auto.value
        if "network_anchor" not in updates:
            updates["network_anchor"] = ConnectionAnchor.auto.value

    for field, value in updates.items():
        setattr(link, field, value)

    if link_created or updates:
        device.updated_at = datetime.now(timezone.utc)
    db.commit()


def unlink_device_from_network(db: Session, device_id: UUID, network_id: UUID) -> None:
    require_device(db, device_id)
    link = db.get(DeviceNetworkLink, {"device_id": device_id, "network_id": network_id})
    if link:
        db.delete(link)
        db.commit()
