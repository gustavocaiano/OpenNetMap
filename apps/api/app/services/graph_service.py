from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Device, DeviceNetworkLink, Host, Network
from app.schemas.graph import DeviceNetworkLinkResponse, GraphResponse
from app.services import device_service, host_service, map_service, network_service


def get_map_graph(db: Session, map_id: UUID) -> GraphResponse:
    map_response = map_service.get_map_or_404(db, map_id)
    devices = db.scalars(select(Device).where(Device.map_id == map_id).order_by(Device.name)).all()
    networks = db.scalars(select(Network).where(Network.map_id == map_id).order_by(Network.cidr)).all()
    hosts = db.scalars(select(Host).join(Network, Host.network_id == Network.id).where(Network.map_id == map_id)).all()
    links = db.scalars(
        select(DeviceNetworkLink)
        .join(Network, DeviceNetworkLink.network_id == Network.id)
        .where(Network.map_id == map_id)
        .order_by(DeviceNetworkLink.network_id, DeviceNetworkLink.device_id)
    ).all()

    return GraphResponse(
        map=map_response,
        devices=[device_service._to_response(device) for device in devices],
        networks=[network_service._to_response(db, network) for network in networks],
        hosts=[host_service._to_response(host) for host in hosts],
        device_network_links=[
            DeviceNetworkLinkResponse(
                device_id=link.device_id,
                network_id=link.network_id,
                role=link.role,
                ip_address=str(link.ip_address) if link.ip_address is not None else None,
                label=link.label,
                color=link.color,
                device_anchor=link.device_anchor,
                network_anchor=link.network_anchor,
            )
            for link in links
        ],
    )
