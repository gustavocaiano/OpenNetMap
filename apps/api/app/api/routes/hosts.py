from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.host import HostResponse, HostUpdate
from app.services import host_service


router = APIRouter(tags=["hosts"])


@router.get("/networks/{network_id}/hosts", response_model=list[HostResponse])
def list_hosts(network_id: UUID, db: Session = Depends(get_db)) -> list[HostResponse]:
    return host_service.list_hosts_for_network(db, network_id)


@router.patch("/hosts/{host_id}", response_model=HostResponse)
def update_host(host_id: UUID, payload: HostUpdate, db: Session = Depends(get_db)) -> HostResponse:
    return host_service.update_host(db, host_id, payload)


@router.delete("/hosts/{host_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_host(host_id: UUID, db: Session = Depends(get_db)) -> None:
    host_service.delete_host(db, host_id)
