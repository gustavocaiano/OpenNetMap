from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.error_handlers import api_error
from app.core.config import settings
from app.models import ScanJob
from app.models.enums import NetworkKind, ScanJobStatus
from app.schemas.scan_job import ScanJobCreate, ScanJobResponse
from app.services.network_service import require_network


def _to_response(scan_job: ScanJob) -> ScanJobResponse:
    return ScanJobResponse(
        id=scan_job.id,
        network_id=scan_job.network_id,
        status=scan_job.status,
        scan_profile=scan_job.scan_profile,
        hosts_found_count=scan_job.hosts_found_count,
        raw_output_available=scan_job.raw_output_path is not None,
        error_message=scan_job.error_message,
        created_at=scan_job.created_at,
        started_at=scan_job.started_at,
        finished_at=scan_job.finished_at,
        updated_at=scan_job.updated_at,
    )


def require_scan_job(db: Session, scan_job_id: UUID) -> ScanJob:
    scan_job = db.get(ScanJob, scan_job_id)
    if not scan_job:
        raise api_error(404, "scan_job_not_found", "Scan job not found")
    return scan_job


def create_scan_job(db: Session, network_id: UUID, payload: ScanJobCreate) -> ScanJobResponse:
    network = require_network(db, network_id)
    if network.network_kind == NetworkKind.link.value:
        raise api_error(409, "network_scan_not_allowed", "Scan jobs are only allowed for 'segment' networks")
    if payload.scan_profile != "ping_sweep":
        raise api_error(422, "invalid_scan_profile", "scan_profile must be 'ping_sweep'")
    active_job = db.scalar(
        select(ScanJob).where(
            ScanJob.network_id == network_id,
            ScanJob.status.in_([ScanJobStatus.pending, ScanJobStatus.running]),
        )
    )
    if active_job:
        raise api_error(409, "active_scan_job_exists", "Only one active scan job is allowed per network")
    scan_job = ScanJob(network_id=network_id, status=ScanJobStatus.pending, scan_profile=payload.scan_profile)
    db.add(scan_job)
    db.commit()
    db.refresh(scan_job)
    return _to_response(scan_job)


def list_scan_jobs_for_network(db: Session, network_id: UUID) -> list[ScanJobResponse]:
    require_network(db, network_id)
    scan_jobs = db.scalars(
        select(ScanJob).where(ScanJob.network_id == network_id).order_by(ScanJob.created_at.desc()).limit(20)
    ).all()
    return [_to_response(scan_job) for scan_job in scan_jobs]


def get_scan_job_or_404(db: Session, scan_job_id: UUID) -> ScanJobResponse:
    return _to_response(require_scan_job(db, scan_job_id))


def claim_next_pending_job(db: Session) -> ScanJob | None:
    stmt = (
        select(ScanJob)
        .where(ScanJob.status == ScanJobStatus.pending)
        .order_by(ScanJob.created_at)
        .with_for_update(skip_locked=True)
    )
    job = db.scalar(stmt)
    if not job:
        db.rollback()
        return None
    now = datetime.now(timezone.utc)
    job.status = ScanJobStatus.running
    job.started_at = now
    job.updated_at = now
    db.commit()
    db.refresh(job)
    return job


def mark_job_succeeded(db: Session, job: ScanJob, raw_xml_path: Path, discovered_host_count: int) -> ScanJob:
    now = datetime.now(timezone.utc)
    job.status = ScanJobStatus.succeeded
    job.finished_at = now
    job.updated_at = now
    job.raw_output_path = str(raw_xml_path)
    job.hosts_found_count = discovered_host_count
    db.commit()
    db.refresh(job)
    return job


def mark_job_failed(db: Session, job: ScanJob, message: str) -> ScanJob:
    now = datetime.now(timezone.utc)
    job.status = ScanJobStatus.failed
    job.finished_at = now
    job.updated_at = now
    job.error_message = message
    db.commit()
    db.refresh(job)
    return job


def xml_output_path(scan_job_id: UUID) -> Path:
    return settings.scan_xml_dir / f"{scan_job_id}.xml"
