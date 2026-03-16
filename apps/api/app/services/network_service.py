from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.error_handlers import api_error
from app.models import DeviceNetworkLink, Host, Network, ScanJob
from app.models.enums import NetworkKind, NetworkLayoutMode
from app.schemas.network import LatestScanJobSummary, NetworkCreate, NetworkResponse, NetworkUpdate
from app.services.map_service import require_map
from app.services.validators import (
    ensure_device_link_ip_in_network,
    sql_cidr_value,
    validate_hex_color,
    validate_ipv4_address,
    validate_ipv4_cidr,
)


def _normalize_layout_mode(network_kind: str, layout_mode: str) -> str:
    if network_kind == NetworkKind.link.value:
        return NetworkLayoutMode.node.value
    return layout_mode


def _validate_dns_servers(dns_servers: list[str]) -> list[str]:
    return [validate_ipv4_address(server) for server in dns_servers]


def _latest_scan_job(db: Session, network_id: UUID) -> LatestScanJobSummary | None:
    latest = db.scalar(select(ScanJob).where(ScanJob.network_id == network_id).order_by(ScanJob.created_at.desc()).limit(1))
    if latest is None:
        return None
    return LatestScanJobSummary(
        id=latest.id,
        status=latest.status,
        created_at=latest.created_at,
        finished_at=latest.finished_at,
        hosts_found_count=latest.hosts_found_count,
    )


def _to_response(db: Session, network: Network) -> NetworkResponse:
    device_ids = [link.device_id for link in sorted(network.device_links, key=lambda item: str(item.device_id))]
    host_count = db.scalar(select(func.count(Host.id)).where(Host.network_id == network.id)) or 0
    return NetworkResponse(
        id=network.id,
        map_id=network.map_id,
        name=network.name,
        cidr=str(network.cidr),
        vlan_tag=network.vlan_tag,
        notes=network.notes,
        network_kind=network.network_kind,
        layout_mode=network.layout_mode,
        dhcp_enabled=network.dhcp_enabled,
        gateway_ip=str(network.gateway_ip) if network.gateway_ip is not None else None,
        dns_servers=[str(server) for server in (network.dns_servers or [])],
        color=network.color,
        pos_x=network.pos_x,
        pos_y=network.pos_y,
        device_ids=device_ids,
        host_count=host_count,
        latest_scan_job=_latest_scan_job(db, network.id),
        created_at=network.created_at,
        updated_at=network.updated_at,
    )


def require_network(db: Session, network_id: UUID) -> Network:
    network = db.execute(
        select(Network).options(joinedload(Network.device_links)).where(Network.id == network_id)
    ).unique().scalar_one_or_none()
    if not network:
        raise api_error(404, "network_not_found", "Network not found")
    return network


def list_networks_for_map(db: Session, map_id: UUID) -> list[NetworkResponse]:
    require_map(db, map_id)
    networks = db.scalars(
        select(Network).options(joinedload(Network.device_links)).where(Network.map_id == map_id).order_by(Network.cidr)
    ).unique().all()
    return [_to_response(db, network) for network in networks]


def create_network(db: Session, map_id: UUID, payload: NetworkCreate) -> NetworkResponse:
    require_map(db, map_id)
    normalized_cidr = validate_ipv4_cidr(payload.cidr)
    duplicate = db.scalar(select(Network).where(Network.map_id == map_id, Network.cidr == sql_cidr_value(db, normalized_cidr)))
    if duplicate:
        raise api_error(409, "duplicate_network_cidr", "Duplicate CIDR within the same map")
    network = Network(
        map_id=map_id,
        name=payload.name,
        cidr=normalized_cidr,
        vlan_tag=payload.vlan_tag,
        notes=payload.notes,
        network_kind=payload.network_kind.value,
        layout_mode=_normalize_layout_mode(payload.network_kind.value, payload.layout_mode.value),
        dhcp_enabled=payload.dhcp_enabled,
        gateway_ip=payload.gateway_ip,
        dns_servers=_validate_dns_servers(payload.dns_servers),
        color=validate_hex_color(payload.color) if payload.color is not None else None,
        pos_x=payload.pos_x,
        pos_y=payload.pos_y,
    )
    db.add(network)
    db.commit()
    return _to_response(db, require_network(db, network.id))


def update_network(db: Session, network_id: UUID, payload: NetworkUpdate) -> NetworkResponse:
    network = require_network(db, network_id)
    updates = payload.model_dump(exclude_unset=True)
    target_network_kind = updates.get("network_kind", network.network_kind)
    if "cidr" in updates:
        host_count = db.scalar(select(func.count(Host.id)).where(Host.network_id == network_id)) or 0
        scan_count = db.scalar(select(func.count(ScanJob.id)).where(ScanJob.network_id == network_id)) or 0
        if host_count or scan_count:
            raise api_error(409, "network_cidr_locked", "Cannot change CIDR when hosts or scan jobs exist")
        updates["cidr"] = validate_ipv4_cidr(updates["cidr"])
        duplicate = db.scalar(
            select(Network).where(
                Network.map_id == network.map_id,
                Network.cidr == sql_cidr_value(db, updates["cidr"]),
                Network.id != network.id,
            )
        )
        if duplicate:
            raise api_error(409, "duplicate_network_cidr", "Duplicate CIDR within the same map")
        link_ips = db.scalars(
            select(DeviceNetworkLink.ip_address).where(
                DeviceNetworkLink.network_id == network_id, DeviceNetworkLink.ip_address.is_not(None)
            )
        ).all()
        for link_ip in link_ips:
            ensure_device_link_ip_in_network(link_ip, updates["cidr"])
    if "network_kind" in updates:
        updates["network_kind"] = updates["network_kind"].value
        if updates["network_kind"] == NetworkKind.link.value and network.network_kind != NetworkKind.link.value:
            host_count = db.scalar(select(func.count(Host.id)).where(Host.network_id == network_id)) or 0
            scan_count = db.scalar(select(func.count(ScanJob.id)).where(ScanJob.network_id == network_id)) or 0
            if host_count or scan_count:
                raise api_error(
                    409,
                    "network_kind_change_blocked",
                    "Cannot change network_kind to 'link' when hosts or scan jobs exist",
                )
    if "layout_mode" in updates:
        updates["layout_mode"] = updates["layout_mode"].value
    if "gateway_ip" in updates and updates["gateway_ip"] is not None:
        updates["gateway_ip"] = validate_ipv4_address(updates["gateway_ip"])
    if "dns_servers" in updates and updates["dns_servers"] is not None:
        updates["dns_servers"] = _validate_dns_servers(updates["dns_servers"])
    if "layout_mode" in updates or "network_kind" in updates:
        current_layout_mode = updates.get("layout_mode", network.layout_mode)
        updates["layout_mode"] = _normalize_layout_mode(target_network_kind.value if isinstance(target_network_kind, NetworkKind) else target_network_kind, current_layout_mode)
    if "color" in updates and updates["color"] is not None:
        updates["color"] = validate_hex_color(updates["color"])
    for field, value in updates.items():
        setattr(network, field, value)
    network.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _to_response(db, require_network(db, network_id))


def delete_network(db: Session, network_id: UUID) -> None:
    network = require_network(db, network_id)
    db.delete(network)
    db.commit()
