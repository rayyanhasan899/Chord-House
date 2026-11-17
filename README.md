# Chord House

A guitar-learning application built with **Python/FastAPI**, **TypeScript/Next.js**, React and PostgreSQL, with browser-local audio tools and private practice tracking.

[Open Chord House](https://chord-house.vercel.app/) · [Deployment evidence](docs/deployment/VERCEL-DEPLOYMENT.md) · [Architecture](docs/architecture) · [Implementation reports](docs/implementation/Phase-Reports)

## What you can explore

- Public microphone tuner, chord library/fretboard and synthesized chord playback.
- Metronome, strumming exercises and a training hub with ear training and chord transitions.
- Accounts, onboarding/preferences, private workspace, practice sessions, routines, goals and progress.
- Signed-in song catalogue and learning tools with rights-aware media handling.
- Account data download/deletion and documented security/privacy boundaries.

## Backend and full-stack engineering

FastAPI modules separate domain rules, use cases and persistence. PostgreSQL schemas evolve through Alembic migrations; generated API contracts support the typed frontend client. Cookie sessions, owner-scoped resources and explicit account actions protect private data. Microphone processing and synthesized audio run in the browser.

[Identity/session design](docs/architecture/IDENTITY-AND-SESSIONS.md), [security/privacy](docs/architecture/SECURITY-AND-PRIVACY.md) and [quality qualification](docs/architecture/QUALITY-AND-COMPATIBILITY.md) describe implementation and test boundaries.

## Release status and limitations

The owner reports the application completed. The [13 November deployment record](docs/deployment/VERCEL-DEPLOYMENT.md) records a live Vercel frontend/FastAPI deployment with Neon PostgreSQL and private object storage, 117 passing backend tests and 22 database-dependent tests skipped locally. Hosted checks covered readiness, account isolation, chord search and logout. These are historical results, not newly rerun tests.

The [collection import record](docs/deployment/SONG-IMPORT-2026-11-13.md) records verification of 24 owner-supplied songs through authenticated APIs. Recordings and lyric text are **not committed to Git**; private media is separate from this public source repository. Distribution provenance is owner attestation, not an independently reviewed license document. Reference catalogue entries do not imply playable or licensed arrangements.

Email is intentionally disabled in the documented deployment: verification/recovery requests return unavailable rather than claiming delivery. Production rollback, provider-failure simulation and matched database/media restoration remain unverified. Real-device audio/cross-browser coverage has documented gaps. A public source release does not imply every historical phase gate passed or a production-service guarantee.

The completed source is on `codex/phase-19`; the early `main` branch is retained as history. Source publication does not redeploy the application or change its database/media access.

## Run locally

Requires Node 24.x/npm 11.x, Python 3.14.x and a running Docker engine. From this repository in PowerShell:

```powershell
npm ci
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.lock
backend/.venv/Scripts/python -m pip install --no-deps -e backend
backend/.venv/Scripts/python scripts/dev.py
```

Open http://127.0.0.1:3000 . API docs: http://127.0.0.1:8000/docs . The launcher creates a gitignored root .env for a new database, starts PostgreSQL on loopback port 5433, migrates/seeds references and starts local servers. It never replaces credentials for an existing volume; restore its original credentials if .env is missing. It leaves an existing frontend process alone. Ctrl+C stops its own server children; the database volume persists. Stop the database separately with `docker compose stop db`; do not delete volumes to fix authentication.

On Linux use backend/.venv/bin/python. Manual server startup remains possible with exported CHORD_DATABASE_URL, Alembic upgrade, uvicorn (app-dir backend, port 8000, no-access-log) and npm run dev. Backend .env.example documents configuration. The application reads process environment; the launcher loads the root local .env.

## Verification

From the root: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run contracts:check`. Contract generation requires the backend environment (`CHORD_PYTHON` can select its interpreter).

From `backend`: virtual-environment Python `-m ruff check .`, `-m ruff format --check .`, `-m mypy app`. `tests/run_postgres.py` runs isolated database tests; `--browser` adds the real browser journey. Install Chromium from `frontend` with `npx playwright install chromium` first. Never use personal or production data for integration tests.

## Configuration and rights

Use ignored local environment files and the existing examples; never commit credentials or development mail codes. The [installation guide](docs/implementation/INSTALLATION-AND-PREREQUISITES.md) and [cloud operations guide](docs/architecture/CLOUD-SONG-OPERATIONS.md) document prerequisites and environment boundaries. No media files, new license, credentials or infrastructure changes are introduced by this documentation pass. Development records preserve AI-assisted implementation context; no independent handwritten authorship claim is implied.
