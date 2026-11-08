# Chord House

Phase 02 provides a Next.js frontend and FastAPI skeleton. Accounts, database features, songs and audio tools are not available yet.

## Setup

Use Node 24.x, npm 11.x and Python 3.14.x. No database or hosted account is needed yet. From the repository root in PowerShell:

```powershell
npm ci
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.lock
backend/.venv/Scripts/python -m pip install --no-deps -e backend
npm run dev
```

Open http://127.0.0.1:3000 . In another terminal:

```powershell
backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

API documentation: http://127.0.0.1:8000/docs . No learning endpoints exist yet. Environment examples document the zero-variable configuration. Real environment files are ignored. Linux uses `.venv/bin/python` instead of `.venv/Scripts/python`.

## Verification

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from the root. Install the browser once with `npx playwright install chromium` from `frontend`, then run `npm run test:e2e` from the root. Browser tests start the production frontend, so build first.

From backend, run `.venv/Scripts/python -m ruff check .`, `.venv/Scripts/python -m ruff format --check .`, `.venv/Scripts/python -m mypy app`, and `.venv/Scripts/python -m pytest`.

## Structure and scope

Frontend routes live in frontend/src/app. Shared utilities live in frontend/src/lib. shadcn/ui configuration is prepared; complete components and the design system follow in Phase 06. Backend/app is the ASGI skeleton. Add domain/application/persistence modules with their actual features rather than creating empty trees. Database connection/migration infrastructure starts in Phase 03. Browser audio stays local.

Commit npm package-lock.json and backend/requirements-dev.lock. Python lock records exact transitive versions; regenerate using pip freeze after installing the project's dev extra, excluding the editable local project. CI checks formatting, lint, types, tests, builds and Chromium smoke tests.

See docs/implementation/README.md for the phase workflow. Original supplied source documents remain unchanged and untracked locally; a new checkout needs them separately for requirements work, but they are not needed to run this foundation.

## Phase 03 backend and PostgreSQL

Liveness: http://127.0.0.1:8000/api/v1/health/live . Readiness: http://127.0.0.1:8000/api/v1/health/ready . Without a database the API still starts, but readiness returns 503. Readiness checks database connectivity, not business-table or migration readiness. OpenAPI documents health responses and shared error schemas.

For a new local database, keep this PowerShell terminal open so its generated password remains available. Do not replace credentials for an existing volume; use its original password. No actual credentials are stored in tracked files.

```powershell
$env:CHORD_DB_PASSWORD = python -c "import secrets; print(secrets.token_hex(24))"
$env:CHORD_DATABASE_URL = "postgresql+psycopg://chord_house:$($env:CHORD_DB_PASSWORD)@127.0.0.1:5433/chord_house"
docker compose up -d --wait db
backend/.venv/Scripts/python -m alembic -c backend/alembic.ini upgrade head
backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Persist credentials securely if reusing the named volume across terminal sessions. Compose reads CHORD_DB_PASSWORD from the shell or a local ignored root .env; the backend reads CHORD_ variables from its process environment (examples are not auto-loaded). No public database binding: local database is on 127.0.0.1:5433. `docker compose stop db` preserves the data. Do not delete volumes to fix connection problems.

Run the complete backend suite against a disposable PostgreSQL instance without touching your normal database:

```powershell
cd backend
.venv/Scripts/python tests/run_postgres.py
```

This runner generates credentials in memory, binds an ephemeral loopback port, runs all tests and stops only its own temporary container. For CI, CHORD_TEST_DATABASE_URL points to an isolated service database. Never point integration tests at production or a personal database: they exercise upgrades/downgrades and temporary table creation.

Migration commands: `alembic -c backend/alembic.ini current`, `upgrade head`, `check`, and (only on a reviewed disposable/development database) `downgrade base`, prefixed by the virtual-environment Python `-m`. Generate future revisions using `revision --autogenerate -m DESCRIPTION`, inspect them and test clean upgrade before committing. Phase 03 baseline establishes migration versioning only; business tables arrive later. CHORD_DATABASE_URL_UNPOOLED optionally selects a direct connection for migration work. No schema auto-create at startup.

Structured application logs include allowlisted event, request ID, level and status. Raw URL/query/body, credentials and exception messages are omitted. Uvicorn access logs are disabled to avoid leaking query strings. Every API response has a server-generated X-Request-ID; errors use error.code/message/request_id/fields. Detailed exceptions are intentionally not returned or logged. Feature validation and domain-specific errors follow in their owning phases.
