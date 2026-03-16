from uuid import UUID

from fastapi import APIRouter, Body, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.device import DeviceCreate, DeviceNetworkConnectionUpdate, DeviceResponse, DeviceUpdate
from app.services import device_service


router = APIRouter(tags=["devices"])


@router.get("/maps/{map_id}/devices", response_model=list[DeviceResponse])
def list_devices(map_id: UUID, db: Session = Depends(get_db)) -> list[DeviceResponse]:
    return device_service.list_devices_for_map(db, map_id)


@router.post("/maps/{map_id}/devices", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(map_id: UUID, payload: DeviceCreate, db: Session = Depends(get_db)) -> DeviceResponse:
    return device_service.create_device(db, map_id, payload)


@router.patch("/devices/{device_id}", response_model=DeviceResponse)
def update_device(device_id: UUID, payload: DeviceUpdate, db: Session = Depends(get_db)) -> DeviceResponse:
    return device_service.update_device(db, device_id, payload)


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: UUID, db: Session = Depends(get_db)) -> None:
    device_service.delete_device(db, device_id)


@router.put("/devices/{device_id}/networks/{network_id}", status_code=status.HTTP_204_NO_CONTENT)
def link_device_network(
    device_id: UUID,
    network_id: UUID,
    payload: DeviceNetworkConnectionUpdate | None = Body(default=None),
    db: Session = Depends(get_db),
) -> Response:
    device_service.link_device_to_network(db, device_id, network_id, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/devices/{device_id}/networks/{network_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_device_network(device_id: UUID, network_id: UUID, db: Session = Depends(get_db)) -> Response:
    device_service.unlink_device_from_network(db, device_id, network_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
