from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.graph import GraphResponse
from app.schemas.map import MapCreate, MapResponse, MapUpdate
from app.services import graph_service, map_service


router = APIRouter(tags=["maps"])


@router.get("/maps", response_model=list[MapResponse])
def list_maps(db: Session = Depends(get_db)) -> list[MapResponse]:
    return map_service.list_maps(db)


@router.post("/maps", response_model=MapResponse, status_code=status.HTTP_201_CREATED)
def create_map(payload: MapCreate, db: Session = Depends(get_db)) -> MapResponse:
    return map_service.create_map(db, payload)


@router.get("/maps/{map_id}", response_model=MapResponse)
def get_map(map_id: UUID, db: Session = Depends(get_db)) -> MapResponse:
    return map_service.get_map_or_404(db, map_id)


@router.patch("/maps/{map_id}", response_model=MapResponse)
def update_map(map_id: UUID, payload: MapUpdate, db: Session = Depends(get_db)) -> MapResponse:
    return map_service.update_map(db, map_id, payload)


@router.delete("/maps/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map(map_id: UUID, db: Session = Depends(get_db)) -> None:
    map_service.delete_map(db, map_id)


@router.get("/maps/{map_id}/graph", response_model=GraphResponse)
def get_map_graph(map_id: UUID, db: Session = Depends(get_db)) -> GraphResponse:
    return graph_service.get_map_graph(db, map_id)
