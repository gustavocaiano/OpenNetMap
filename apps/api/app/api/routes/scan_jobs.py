from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.scan_job import ScanJobCreate, ScanJobResponse
from app.services import scan_job_service


router = APIRouter(tags=["scan_jobs"])


@router.get("/networks/{network_id}/scan-jobs", response_model=list[ScanJobResponse])
def list_scan_jobs(network_id: UUID, db: Session = Depends(get_db)) -> list[ScanJobResponse]:
    return scan_job_service.list_scan_jobs_for_network(db, network_id)


@router.post("/networks/{network_id}/scan-jobs", response_model=ScanJobResponse, status_code=status.HTTP_201_CREATED)
def create_scan_job(network_id: UUID, payload: ScanJobCreate, db: Session = Depends(get_db)) -> ScanJobResponse:
    return scan_job_service.create_scan_job(db, network_id, payload)


@router.get("/scan-jobs/{scan_job_id}", response_model=ScanJobResponse)
def get_scan_job(scan_job_id: UUID, db: Session = Depends(get_db)) -> ScanJobResponse:
    return scan_job_service.get_scan_job_or_404(db, scan_job_id)
