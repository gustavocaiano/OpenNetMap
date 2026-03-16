from fastapi import FastAPI

from app.api.error_handlers import install_error_handlers
from app.api.routes import devices, health, hosts, maps, networks, scan_jobs
from app.core.logging import configure_logging
from app.db.session import init_engine


configure_logging()
app = FastAPI(title="OpenNetMap API", version="0.1.0")
init_engine()
install_error_handlers(app)

app.include_router(health.router)
app.include_router(maps.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(networks.router, prefix="/api/v1")
app.include_router(hosts.router, prefix="/api/v1")
app.include_router(scan_jobs.router, prefix="/api/v1")
