# OpenNetMap

OpenNetMap is a network inventory and topology mapping app for tracking maps, devices, networks, hosts, and scan jobs from a single UI.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Worker: Python background loop that runs `nmap` scan jobs and stores raw XML output
- Frontend: React, TypeScript, Vite
- Runtime: Docker Compose with nginx serving the built frontend and proxying `/api/` to the API

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Optional for local development: Python 3.11+ and Node.js 20+

## Run With Docker Compose

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack:

   ```bash
   docker compose up --build
   ```

3. Stop the stack when finished:

   ```bash
   docker compose down
   ```

The API container runs `alembic upgrade head` before starting uvicorn. PostgreSQL data is persisted in the `pgdata` named volume, and scan XML output is persisted in the `scan_data` named volume.

## Local Checks

Backend tests:

```bash
cd apps/api && pytest
```

Frontend production build:

```bash
cd apps/web && npm install && npm run build
```

## Service URLs

- Web app: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/healthz
- Frontend-to-API proxy path: http://localhost:3000/api/

## macOS and Docker Desktop Note

`nmap` runs inside the Linux worker container, not directly on macOS. On Docker Desktop for macOS this means scan results can differ from running `nmap` on the host because the container is on Docker's virtualized network layer and may not have the same reachability or broadcast visibility as the host machine.
