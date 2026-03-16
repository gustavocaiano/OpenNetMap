from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.network import NetworkCreate, NetworkResponse, NetworkUpdate
from app.services import network_service


router = APIRouter(tags=["networks"])


@router.get("/maps/{map_id}/networks", response_model=list[NetworkResponse])
def list_networks(map_id: UUID, db: Session = Depends(get_db)) -> list[NetworkResponse]:
    return network_service.list_networks_for_map(db, map_id)


@router.post("/maps/{map_id}/networks", response_model=NetworkResponse, status_code=status.HTTP_201_CREATED)
def create_network(map_id: UUID, payload: NetworkCreate, db: Session = Depends(get_db)) -> NetworkResponse:
    return network_service.create_network(db, map_id, payload)


@router.patch("/networks/{network_id}", response_model=NetworkResponse)
def update_network(network_id: UUID, payload: NetworkUpdate, db: Session = Depends(get_db)) -> NetworkResponse:
    return network_service.update_network(db, network_id, payload)


@router.delete("/networks/{network_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_network(network_id: UUID, db: Session = Depends(get_db)) -> None:
    network_service.delete_network(db, network_id)
