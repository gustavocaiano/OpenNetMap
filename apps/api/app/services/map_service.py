from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.error_handlers import api_error
from app.models import Device, Host, Network, NetworkMap
from app.schemas.map import MapCreate, MapResponse, MapUpdate


def _counts_for_map(db: Session, map_id: UUID) -> tuple[int, int, int]:
    device_count = db.scalar(select(func.count(Device.id)).where(Device.map_id == map_id)) or 0
    network_count = db.scalar(select(func.count(Network.id)).where(Network.map_id == map_id)) or 0
    host_count = db.scalar(
        select(func.count(Host.id)).join(Network, Host.network_id == Network.id).where(Network.map_id == map_id)
    ) or 0
    return device_count, network_count, host_count


def _to_response(db: Session, map_obj: NetworkMap) -> MapResponse:
    device_count, network_count, host_count = _counts_for_map(db, map_obj.id)
    return MapResponse(
        id=map_obj.id,
        name=map_obj.name,
        description=map_obj.description,
        device_count=device_count,
        network_count=network_count,
        host_count=host_count,
        created_at=map_obj.created_at,
        updated_at=map_obj.updated_at,
    )


def list_maps(db: Session) -> list[MapResponse]:
    maps = db.scalars(select(NetworkMap).order_by(NetworkMap.name, NetworkMap.created_at)).all()
    return [_to_response(db, map_obj) for map_obj in maps]


def create_map(db: Session, payload: MapCreate) -> MapResponse:
    map_obj = NetworkMap(name=payload.name, description=payload.description)
    db.add(map_obj)
    db.commit()
    db.refresh(map_obj)
    return _to_response(db, map_obj)


def get_map_or_404(db: Session, map_id: UUID) -> MapResponse:
    return _to_response(db, require_map(db, map_id))


def require_map(db: Session, map_id: UUID) -> NetworkMap:
    map_obj = db.get(NetworkMap, map_id)
    if not map_obj:
        raise api_error(404, "map_not_found", "Map not found")
    return map_obj


def update_map(db: Session, map_id: UUID, payload: MapUpdate) -> MapResponse:
    map_obj = require_map(db, map_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(map_obj, field, value)
    map_obj.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(map_obj)
    return _to_response(db, map_obj)


def delete_map(db: Session, map_id: UUID) -> None:
    map_obj = require_map(db, map_id)
    db.delete(map_obj)
    db.commit()
