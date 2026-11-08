# Chord House

Your home for guitar learning. Phases 01–11 provide accounts, secure login/logout, onboarding/preferences, email verification and password recovery, a private workspace, tuner, chord library, metronome and strumming patterns, a responsive light/dark interface, API documentation and PostgreSQL migrations. Songs and practice tracking arrive in their assigned later phases.

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

## Accounts and mail

Create an account, sign in, choose an instrument/level and save preferences. Verification/reset codes are delivered to private .local-mail JSON files in the backend process working directory during development; use the newest matching recipient/purpose code in /verify or /reset. These files contain sensitive codes: never commit them or paste them into chat. No external SMTP delivery is configured locally. Production requires configured certificate-verified SMTP and explicit HTTPS trusted origins. Session/account privacy limits are documented in docs/architecture/IDENTITY-AND-SESSIONS.md. Full data export and deletion UI remain privacy-hardening scope, while the verified deletion API already exists.

## Checks

Run npm run format:check, npm run lint, npm run typecheck, npm test and npm run build from the root. API contract generation/check: npm run contracts:generate and npm run contracts:check. The generator uses the backend virtual environment; CHORD_PYTHON can override the interpreter.

From backend, run .venv/Scripts/python -m ruff check ., .venv/Scripts/python -m ruff format --check ., and .venv/Scripts/python -m mypy app. To verify real PostgreSQL/backend behavior run `.venv/Scripts/python tests/run_postgres.py`.

For the complete real browser journey, install Chromium once with `npx playwright install chromium` from frontend, then run `.venv/Scripts/python tests/run_postgres.py --browser` from backend. It runs backend tests and builds/serves an isolated production frontend on 3100 against a test API on 8100; no test users are placed in the local personal database. Test output/mail/screenshots are ignored. After that harness, rebuild normally with npm run build before using npm start, because the harness build targets its test API. npm run dev always uses the normal configured origin. Standalone npm run test:e2e is smoke mode and explicitly skips account integration without the harness.

## Structure and migrations

frontend/src/app contains route groups; features/auth owns account UI; components/ui holds shared primitives; lib/api holds generated schemas and typed client. Backend modules own domain rules, persistence and use cases; composition lives in app/core and main. No browser credentials in localStorage. PostgreSQL changes use reviewed Alembic migrations, never auto-create. `python -m app.modules.catalog.seeds` from backend explicitly installs non-overwriting instrument/tuning references; no songs or accounts are seeded. Never run migration downgrades or integration tests on personal/production data.

See docs/architecture/FRONTEND-FOUNDATION.md, DOMAIN-AND-DATA-MODEL.md and the reports in docs/implementation/Phase-Reports. Follow the 20-phase prompt index one phase at a time unless the owner explicitly authorizes a sequence. Original source documents remain untouched and untracked locally; supply them separately when resuming requirements work from a fresh checkout.

## Workspace and tuner (Phases 07/08)

/dashboard adds private tasks, collections, notes and favorites over reviewed song references; actual song population remains Phase 12. /tuner is public and processes microphone audio locally in a worker. Choose instrument/tuning/target, then Start and allow microphone use; Stop releases capture. Standard/Drop D/DADGAD guitar, standard bass and re-entrant ukulele are included. Synthetic tests pass; real-device calibration is still being collected. See TUNER.md and phase reports for exact limitations.

## Chords and metronome (Phases 09/10)

Open `/chords` without signing in to search 198 structured voicings, inspect diagrams, edit a fretboard and play synthesized chords/arpeggios. Sign in to save, edit and delete private custom chords. Shapes have automated pitch/fingering checks; no expert ergonomic review is claimed. Bass initially covers major/minor.

Open `/metronome`, set 30–300 BPM (or tap), choose 2/4, 3/4, 4/4 or 6/8, sound, accent, volume and visual beats, then press Start. Stop releases audio. In 6/8 each click is an eighth note. No account or microphone is needed. Brief UI stalls are tolerated by audio-clock lookahead; background tabs, device sleep or long stalls can interrupt playback. Restart after suspension. See docs/architecture/METRONOME.md for timing evidence and limits. Both tools work locally with the existing installation; no additional service or environment variables are needed. Use headphones or speakers to check sound on your own device.

## Strumming patterns (Phase 11)

Sign in and open `/patterns` for 12 original exercises, filters, count/stroke notation, synchronized metronome/chord playback, looping and accents. Create private patterns or save private copies; edit/delete them and save favorites. Playback uses synthesized tones, not guitar recordings. Shared pattern management is available to content managers through authorized API endpoints; full admin UI follows in Phase 15. Apply migrations and run the existing reference seed command (the local launcher does both). No extra service is needed. See docs/architecture/STRUMMING.md for usage, endpoints, rights/publication rules and limits.
