import logging
import time

from app.core.config import settings
from app.db.session import SessionLocal, init_engine
from app.models import Network
from app.services import host_service, nmap_parser, nmap_runner, scan_job_service


logger = logging.getLogger(__name__)


def run_forever() -> None:
    init_engine()
    settings.scan_xml_dir.mkdir(parents=True, exist_ok=True)
    while True:
        with SessionLocal() as db:
            job = scan_job_service.claim_next_pending_job(db)
            if job is None:
                time.sleep(settings.worker_poll_interval_seconds)
                continue
            network = db.get(Network, job.network_id)
            try:
                xml_payload = nmap_runner.run_ping_scan(network.cidr)
                xml_path = scan_job_service.xml_output_path(job.id)
                xml_path.write_text(xml_payload, encoding="utf-8")
                discovered_hosts = nmap_parser.parse_nmap_ping_scan(xml_payload)
                discovered_count = host_service.merge_discovered_hosts(db, network, job, discovered_hosts)
                db.commit()
                scan_job_service.mark_job_succeeded(db, job, xml_path, discovered_count)
            except Exception as exc:  # pragma: no cover
                db.rollback()
                logger.exception("scan job failed", extra={"scan_job_id": str(job.id)})
                scan_job_service.mark_job_failed(db, job, str(exc))
