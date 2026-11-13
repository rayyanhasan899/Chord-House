# Chord House

Phase 17 adds [account data download, confirmed deletion and security/privacy hardening](docs/architecture/SECURITY-AND-PRIVACY.md). Sign in and open My account → Your data and account. Your existing learning tools remain available; only explicitly saved practice sessions contribute to progress.

Current isolated branch: codex/phase-18 in .artifacts/phase18-worktree. Phase 18 adds [quality and compatibility qualification](docs/architecture/QUALITY-AND-COMPATIBILITY.md), lighter rights-aware song listings, browser audio recovery and chord rendering fixes. It reuses the isolated Phase 17 preview at http://127.0.0.3:3002, including its existing preview accounts/volume; the original app and unfinished song changes remain separate. See [installation](docs/implementation/INSTALLATION-AND-PREREQUISITES.md) and the Phase 18 report for actual checks, startup and device gaps.

Phase 16 adds the signed-in [training hub and separate preview](docs/architecture/TRAINING.md): chord transitions/challenge, local ear training, note finder, approved-text section cues, routine suggestions, private assessments and optional visible-tab reminders. Only explicitly saved Practice sessions grant time credit. Closed-browser reminders and unlicensed song playback are not promised.

Phase 16 is on `codex/phase-16` in `.artifacts/phase16-worktree` to preserve unfinished song changes in the original checkout. From that worktree run `npm ci`, then `python scripts/dev-preview.py`, and open **http://127.0.0.2:3001/training**. Register a preview account; it uses a separate persistent database. Use this hostname to keep its cookie separate from normal 127.0.0.1 usage. See ADR-0022 and the Phase 16 report.

Your home for guitar learning. Phases 01–14 provide accounts, secure login/logout, onboarding/preferences, email verification and password recovery, a private workspace, tuner, chord library, metronome, strumming patterns and song discovery/learning, a responsive light/dark interface, API documentation and PostgreSQL migrations. Practice sessions, reusable routines and goal settings are available; progress summaries, streaks and roadmap are available.

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

## Songs (Phase 12)

Sign in and open `/songs` to search English/Urdu/Hindi entries and Roman/native aliases. Filter and page through results, open dedicated pages, save private favorites/collections and track learning status. The bundle contains 85 popular-song identities (30 English, 26 Urdu, 29 Hindi) with source metadata; their lyrics and arrangements are unavailable because no licensed source has been supplied. Six separately labeled original practice songs contain complete original text and 18 guitar/bass/ukulele chord exercises with diagrams, transposition, text size and practice view. They include Roman Urdu/Hindi and two native-script variants, with no supplied melody/vocal recording. Do not mistake these originals for popular-song arrangements.

The owner confirmed song pages require sign-in. Existing startup applies migration 0008 and seeds without overwriting edits/withdrawals; no provider account/key or runtime network is needed. Managers can stage/review/commit further rights-cleared content via API or the interactive local import CLI. See docs/architecture/SONGS.md, docs/implementation/SONG-CONTENT-INVENTORY.md and PHASE-12-REPORT.md for exact rights/coverage, workflow and tests. Full manager UI remains Phase 15.


## Practice (Phase 13)

Sign in and open `/practice`. Start a count-up session or set a target, pause/resume, end, review and explicitly save. Refreshing or navigating away keeps the server timer running. Only saved sessions enter history. Link songs, private chords or a chord symbol, add a focus/notes, and edit/delete your records. Time corrections explicitly replace pause segments; future/overlapping saved time is rejected. Sessions over four hours require confirmation; the maximum saved active duration is 24 hours.

Build, reorder, edit, duplicate and delete private routines. The player advances by active time and preserves its starting routine snapshot even if the template changes. Guided tools show chords and reuse metronome/pattern audio; song practice and tuner open in a separate tab. Audio requires its own Play action and closes on pause/end/activity change/navigation. Set or pause daily/weekly goal settings without altering history. Open /progress for totals, streaks, charts, weekly review and roadmap.

Existing startup applies reviewed migration `0009_practice`; no new package, provider, payment or environment variable is needed. See [practice guide](docs/architecture/PRACTICE.md) for timer behavior, validation and APIs. Unit tests use one worker to fit local memory; larger environments may override Vitest's worker count.


## Progress and roadmap (Phase 14)

Open `/progress` while signed in for saved-practice totals, goal progress, streaks, charts, linked-session rankings, weekly review/reflection and private self-reported roadmap milestones. The dashboard includes a compact summary. Current profile timezone, Monday weeks and positive saved active time determine the calendar; edits/deletes recalculate on refresh. Apply migration `0010_progress` with the normal launcher. No new package/provider is required. See [progress guide](docs/architecture/PROGRESS.md) and ADR-0020 for exact goal/calendar rules and limitations.


## Administration (Phase 15)

Authorized content managers can open `/admin` to maintain instruments, tunings, chord voicings, patterns and song components; review/import content; publish, archive or withdraw rights; resolve private reports; and inspect redacted audit history. Signed-in users can submit and track reports at `/reports`. Apply migration `0011_content` and the normal reference seed. See [content operations](docs/architecture/CONTENT-OPERATIONS.md) for workflow, role provisioning and limits. This does not acquire any popular-song lyrics or arrangement rights.


## Revised Phase 18 song library

The accepted local recording/lyrics player is reconciled with the security/training baseline. Sign in to use your supplied songs. See [folder import and media guide](docs/architecture/SONG-ASSETS.md) for scan/sync/rename, migration 0013 and exact lyric handling; [current Phase 18 report](docs/implementation/Phase-Reports/PHASE-18-REPORT.md) gives test status and the working preview. Historical metadata-only song counts above are not current playable-collection counts. Media and database credentials remain outside Git.


Phase 19 private cloud storage preparation and current release blockers:
[report](docs/implementation/Phase-Reports/PHASE-19-REPORT.md) and
[operator guide](docs/architecture/CLOUD-SONG-OPERATIONS.md).
The current accepted local preview is preserved; online song migration is not complete.
