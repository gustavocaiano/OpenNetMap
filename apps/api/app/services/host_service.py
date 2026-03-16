from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.error_handlers import api_error
from app.models import Host, Network, ScanJob
from app.models.enums import HostDiscoverySource, HostType, NetworkKind
from app.schemas.host import HostResponse, HostUpdate
from app.services.network_service import require_network
from app.services.validators import ensure_ip_in_network, sql_inet_value, validate_ipv4_address


def _to_response(host: Host) -> HostResponse:
    return HostResponse(
        id=host.id,
        network_id=host.network_id,
        ip_address=str(host.ip_address),
        hostname=host.hostname,
        detected_hostname=host.detected_hostname,
        type=host.type,
        notes=host.notes,
        discovery_source=host.discovery_source,
        needs_review=host.needs_review,
        first_seen_at=host.first_seen_at,
        last_seen_at=host.last_seen_at,
        last_scan_job_id=host.last_scan_job_id,
        created_at=host.created_at,
        updated_at=host.updated_at,
    )


def require_host(db: Session, host_id: UUID) -> Host:
    host = db.get(Host, host_id)
    if not host:
        raise api_error(404, "host_not_found", "Host not found")
    return host


def list_hosts_for_network(db: Session, network_id: UUID) -> list[HostResponse]:
    require_network(db, network_id)
    hosts = db.scalars(select(Host).where(Host.network_id == network_id).order_by(Host.ip_address)).all()
    return [_to_response(host) for host in hosts]


def update_host(db: Session, host_id: UUID, payload: HostUpdate) -> HostResponse:
    host = require_host(db, host_id)
    updates = payload.model_dump(exclude_unset=True)

    if "ip_address" in updates and updates["ip_address"] is not None:
        network = require_network(db, host.network_id)
        updates["ip_address"] = validate_ipv4_address(updates["ip_address"])
        ensure_ip_in_network(updates["ip_address"], network.cidr)
        duplicate = db.scalar(
            select(Host).where(
                Host.network_id == host.network_id,
                Host.ip_address == sql_inet_value(db, updates["ip_address"]),
                Host.id != host.id,
            )
        )
        if duplicate:
            raise api_error(409, "duplicate_host_ip", "Duplicate host IP within the same network")

    for field, value in updates.items():
        setattr(host, field, value)
    host.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(host)
    return _to_response(host)


def delete_host(db: Session, host_id: UUID) -> None:
    host = require_host(db, host_id)
    db.delete(host)
    db.commit()


def merge_discovered_hosts(db: Session, network: Network, scan_job: ScanJob, discovered_hosts: list[dict[str, str | None]]) -> int:
    if network.network_kind != NetworkKind.segment.value:
        raise api_error(409, "network_hosts_not_allowed", "Discovered hosts are only supported for 'segment' networks")
    now = datetime.now(timezone.utc)
    count = 0
    for discovered in discovered_hosts:
        ip_address = validate_ipv4_address(str(discovered["ip_address"]))
        ensure_ip_in_network(ip_address, network.cidr)
        host = db.scalar(
            select(Host).where(Host.network_id == network.id, Host.ip_address == sql_inet_value(db, ip_address))
        )
        if not host:
            host = Host(
                network_id=network.id,
                ip_address=ip_address,
                hostname=None,
                detected_hostname=discovered.get("detected_hostname"),
                type=HostType.unknown,
                notes=None,
                discovery_source=HostDiscoverySource.nmap,
                needs_review=True,
                first_seen_at=now,
                last_seen_at=now,
                last_scan_job_id=scan_job.id,
                created_at=now,
                updated_at=now,
            )
            db.add(host)
        else:
            host.detected_hostname = discovered.get("detected_hostname")
            host.last_seen_at = now
            host.last_scan_job_id = scan_job.id
            host.updated_at = now
            if host.type == HostType.unknown:
                host.needs_review = True
        count += 1
    db.flush()
    return count
