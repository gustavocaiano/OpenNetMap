# AGENTS.md

Repository guide for coding agents working in `OpenNetMap/`.

## Scope
- Monorepo with two apps:
  - `apps/api`: FastAPI backend, SQLAlchemy models, Alembic migrations, background scan worker
  - `apps/web`: React + TypeScript + Vite frontend
- Runtime is Docker Compose with `db`, `api`, `worker`, and `web`.
- Scan XML is persisted to the `scan_data` volume.

## Existing Agent / IDE Rules
- No pre-existing root `AGENTS.md` was found.
- No Cursor rules were found:
  - no `.cursor/rules/`
  - no `.cursorrules`
- No Copilot instructions were found:
  - no `.github/copilot-instructions.md`
- Treat this file as the repo-specific instruction set.

## Repo Layout
- `apps/api/app/api/`: FastAPI routes, deps, error handlers
- `apps/api/app/core/`: settings, logging
- `apps/api/app/db/`: SQLAlchemy base, sessions, custom DB types
- `apps/api/app/models/`: ORM models and enums
- `apps/api/app/schemas/`: Pydantic request/response schemas
- `apps/api/app/services/`: business logic and validators
- `apps/api/app/workers/`: scan worker loop
- `apps/api/alembic/`: migrations
- `apps/api/tests/`: pytest unit + integration tests
- `apps/web/src/api/`: frontend DTOs and API wrappers
- `apps/web/src/components/`: reusable UI
- `apps/web/src/pages/`: route pages
- `docker-compose.yml`: full local stack
- `docker/nginx/default.conf`: frontend nginx proxy

## Primary Commands

## Full Stack
- Copy env: `cp .env.example .env`
- Start stack: `docker compose up --build`
- Stop stack: `docker compose down`
- Validate compose: `docker compose config`

## Backend Setup
- `cd apps/api`
- `python3 -m venv .venv`
- `.venv/bin/pip install -e '.[test]'`

## Backend Run Commands
- Run migrations: `cd apps/api && .venv/bin/alembic upgrade head`
- Run API locally: `cd apps/api && .venv/bin/uvicorn app.main:app --reload`
- Run worker locally: `cd apps/api && .venv/bin/python -m app.workers.main`

## Backend Test Commands
- Run all tests: `cd apps/api && .venv/bin/pytest -q`
- Run one file: `cd apps/api && .venv/bin/pytest tests/integration/test_api_flows.py -q`
- Run one test: `cd apps/api && .venv/bin/pytest tests/integration/test_api_flows.py::test_core_api_flow_and_shapes -q`
- Run by keyword: `cd apps/api && .venv/bin/pytest -k scan -q`

## Frontend Commands
- Install deps: `cd apps/web && npm install`
- Dev server: `cd apps/web && npm run dev`
- Production build: `cd apps/web && npm run build`
- Preview build: `cd apps/web && npm run preview`

## Lint / Format Status
- No dedicated lint command is configured.
- No dedicated formatter command is configured.
- Do not invent `lint` or `format` steps unless you add them intentionally.
- Current safe verification steps are:
  - backend: `pytest`
  - frontend: `npm run build`
  - stack: `docker compose config`

## Backend Conventions
- Use Python 3.11+ features already present in the repo.
- Keep FastAPI routes thin; put logic in `app/services/`.
- Prefer service-layer helper functions like `require_*` for 404 checks.
- Use SQLAlchemy 2 style queries with `select(...)`, typed `Session`, `db.scalar`, and `db.scalars`.
- Use `snake_case` for Python files, functions, variables, and schema fields.
- Add explicit return types where practical, especially in services.
- Follow the current write pattern:
  - `db.add(...)`
  - `db.commit()`
  - `db.refresh(...)` when returning fresh rows
- Update `updated_at` manually in the same places existing code does.

## Backend Imports / Structure
- Import order: standard library, third-party, local imports.
- Avoid wildcard imports.
- Keep layering consistent:
  - routes -> services -> models/schemas
- Reuse shared validators in `app/services/validators.py` instead of duplicating IP/CIDR/color logic.

## Backend Error Handling
- Use `api_error(status, code, message)` from `apps/api/app/api/error_handlers.py`.
- Preserve the canonical JSON error shape:
  - `{"error": {"code": str, "message": str}}`
- Do not hand-roll custom error response formats in routes.
- On worker failures, rollback first, then mark the job failed.

## Backend Data / Migration Rules
- Never rewrite old Alembic migrations; add a new migration instead.
- Keep PostgreSQL behavior in mind even though tests use SQLite.
- The repo uses custom CIDR/INET DB types; do not replace them casually.
- When changing scan behavior, review runner, parser, merge, and tests together.

## Frontend Conventions
- Use TypeScript everywhere; avoid `any` unless unavoidable.
- Prefer named exports; current frontend code follows that pattern.
- Use function components with explicit prop types.
- Use `camelCase` for JS/TS variables and functions.
- Use `PascalCase` for React components and component filenames.
- Keep API DTOs and wrappers in `src/api/` thin and typed.
- Use React Query for server state and cache invalidation.
- Use local React state for transient UI state.
- Prefer Mantine primitives for layout, forms, and feedback.

## Frontend Error Handling
- Use the shared `request()` helper in `apps/web/src/api/client.ts`.
- Surface failures to users; do not fail silently.
- Prefer `getErrorMessage(error, fallback)` when rendering mutation/query failures.
- If a backend error is actionable, show the backend message directly.

## UI / UX Expectations
- The audience is system and network administrators.
- Optimize for clarity, workflow density, and operational usefulness.
- Prefer sober, professional admin UI over generic dashboard styling.
- Avoid instructional clutter on cards; show real notes, metadata, and state.
- Keep map movement stable; avoid jumpy auto-fit or surprise relayouts.
- For editing dense data like connections, prefer compact tables/rows over many stacked cards.

## Testing Guidance
- Backend tests use pytest plus FastAPI `TestClient` and an in-memory SQLite fixture in `apps/api/tests/conftest.py`.
- Add unit tests for validators/parsers and integration tests for API contracts.
- Frontend currently has no automated test suite; `npm run build` is the main verification step.
- For scan-related work, do a Docker smoke run when practical because runtime behavior may differ from tests.

## Scan / Networking Caveats
- `nmap` runs in the worker container, not on the host.
- On macOS Docker Desktop, scan reachability may differ from host-native `nmap`.
- Be conservative when changing scan behavior.
- Do not trust broad “all hosts up” results without checking parser behavior and Nmap status reasons.

## Agent Workflow Tips
- Read the relevant route/service/component before editing; behavior is often centralized.
- If changing API shapes, update both backend and frontend in the same task.
- After backend changes, run targeted pytest first, then the full suite if the change is broad.
- After frontend changes, run `npm run build`.
- If Docker/runtime behavior is affected, validate with `docker compose config` and a smoke run when practical.
- Prefer focused improvements over large rewrites unless the task explicitly calls for a redesign.
