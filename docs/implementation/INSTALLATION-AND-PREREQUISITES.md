# Installation and prerequisites

## Phase 18 current preview and quality checks

Current checkout is `.artifacts/phase18-worktree`, branch `codex/phase-18`, based on completed Phase 17. It updates the existing isolated `chord-house-preview` application at http://127.0.0.3:3002 with API 8002 and DB 5435. The prior preview's generated `.env.preview` credential is preserved in this ignored checkout configuration; existing preview volume/accounts are reused, with no new migration (head `0012_integration`). Original app/personal data and unfinished song code are separate and unchanged. Preserve the credential with its volume; never generate a replacement for an existing volume.

For a normal restart from this checkout: `npm ci`, then `python scripts/dev-preview.py` with Docker running. This workstation also supports a production preview: `docker compose --env-file .env.preview -f compose.preview.yaml up -d --build --wait`, set process `CHORD_API_ORIGIN=http://127.0.0.1:8002`, build with `npm --workspace frontend run build -- --webpack`, then `npm --workspace frontend run start -- --hostname 127.0.0.3 --port 3002`. Do not start a second frontend on an occupied port or build while that checkout's production server uses its output. The default Turbopack production build is checked on Linux; its Windows CSS helper failed locally, so the supported alternative builder is explicit.

See `../architecture/QUALITY-AND-COMPATIBILITY.md` for disposable-database profiling, browser checks, budgets and device procedure. CI uses official Playwright 1.65.0 Noble on Ubuntu 24.04, with correctly owned container home for Firefox. This is not a hosting decision. No physical guitar, speaker, mobile or Safari certification follows from generated audio or emulation. Owner offered current-device Chrome, then asked the agent to perform the checks; no physical measurement is inferred.

The nearly full C: drive interrupted local work. Rebuildable npm `_npx` and automated Playwright caches were preserved under ignored Phase 18 `.artifacts/host-cache` with junctions at their original C: locations. These contain tools, not personal browser profiles. Keep targets while these links exist, or relocate caches and links together; do not delete targets as ordinary disposable test output. Temporary writes use D: process settings. No personal data/volumes were removed or Windows policy weakened. The Phase 18 report records runtime recovery and final readiness.

## Phase 16 isolated preview

Phase 16 is in `.artifacts/phase16-worktree`, branch `codex/phase-16`; original uncommitted song changes and personal database are retained. Do not migrate the old checkout's database using the new branch while continuing to run its old migration tree. From the Phase 16 checkout run `npm ci`, then `python scripts/dev-preview.py`. Requirements: Node 24/npm 11, Python 3.14 standard library and responsive Docker. The backend runs in Linux without changing Windows Application Control.

Open **http://127.0.0.2:3001/training** and register a preview account. Use this hostname to separate its cookie from normal 127.0.0.1 usage. API 8001 and DB 5434 bind loopback. Project/volumes are chord-house-phase16-preview; ignored .env.preview credentials must be preserved with the persistent database. No private data, roles or unfinished song-player changes are copied. Full start/stop/mail instructions are in ../architecture/TRAINING.md. Normal single-checkout upgrade uses reviewed 0012_integration plus the existing seed/restart. Training requires no new dependency, paid provider or content key. Browser notifications remain optional and visible-tab only.

Inspected 2026-11-08 on Windows/PowerShell. Git 2.53.0, gh 2.103.3, Node 24.15.0, npm 11.12.1, Python 3.14.7, pip 26.2.1, Docker Engine 29.3.1 and Compose 5.1.1 are present. Docker daemon responds. GitHub repository visibility is PRIVATE and read access works; push permission is not yet verified. No application, lockfiles, tests or CI exist. No dependencies installed during planning. Terminal/filesystem access works; browser tooling exists but no browser/device/audio session was tested. No PostgreSQL CLI on PATH; existing database containers were not inspected.

## Mandatory local setup

No immediate system installation is required. Use existing Node 24 LTS and npm, verify `node --version` and `npm --version`; official runtime: https://nodejs.org/en/download . Phase 02 must verify exact dependency engine compatibility before locking versions.

Use existing Python 3.14 if chosen dependency releases support it. Proposed fallback is Python 3.12â€“3.13 in a project virtual environment only if compatibility tests justify it; do not downgrade the user's global installation. Verify `python --version` and `python -m pip --version`. Official installers: https://www.python.org/downloads/ . Phase 02 chooses and records the supported exact version; no unsupported range is represented as already tested.

PostgreSQL is mandatory; a local system installation is optional because Docker is available. Codex will write Compose and use a supported pinned PostgreSQL image (proposed PostgreSQL 17, verify supported release and driver compatibility in phase 03), named volume and loopback-only port. Check `docker info` and `docker compose version`. Never delete existing volumes. Documentation: https://www.postgresql.org/docs/ and https://docs.docker.com/compose/ . No paid database needed locally. uv is optional and absent; pip/venv suffice.

## Codex handles

Project folders, scaffolding, local dependencies and lockfiles, virtual environment, Compose, environment examples, development commands, migrations, tests, generated OpenAPI types, CI, documentation and scoped Git branches/commits/PRs. Keep existing user documents intact. No application commands can be given as already working before phase 02 creates scripts.

## User actions only when needed

Keep Docker Desktop running. If the engine stops, start it and verify `docker info`. GitHub read access already works; if push later fails, authenticate locally with `gh auth login` and verify `gh repo view --json visibility`; never paste credentials in chat. Official CLI: https://cli.github.com/ . Review and approve PR merges yourself.

When using tuner, press Start then accept the browser microphone permission. Use localhost locally or HTTPS remotely; device and microphone testing requires actual hardware access. Notification permission is optional and requested only after explanation/action.

Before online deployment, create selected provider accounts, choose region, configure secrets through local environment/provider secret settings and authorize repository deployment. No provider account is currently required. Email verification/password-reset delivery needs a suitable provider or SMTP credentials online; local capture is development-only. Obtain content permissions or authorize an appropriate licensed provider; do not supply copied copyrighted lyrics as evidence of rights.

## Provider evaluation and deployment

Checked official sources on 2026-11-08: Vercel Hobby is a personal/non-commercial candidate for Next.js and has usage restrictions (https://vercel.com/docs/plans/hobby , https://vercel.com/pricing ). Render free web services are a FastAPI candidate but have free-service restrictions; its free PostgreSQL instances expire after 30 days, so they are unsuitable as a permanent personal library database (https://render.com/docs/free , https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90 ). These are candidates, not selected providers or verified deployments. No account-specific entitlement was checked.

Phase 19 must compare at least one durable free PostgreSQL option with current official pricing/terms, storage/compute/bandwidth/connection limits, idle sleeping, retention, backup/restore/export, regions, TLS and migration support. Record exact dated quotas before selection. Verify Next.js runtime, FastAPI process support, same-origin API routing/cookie behavior, CSRF and browser restrictions, GitHub private-repository support, build quotas, rollback and cold-start behavior. Avoid an expiring database for durable use. No guarantee of continuous free hosting. Local operation remains independent of hosting setup.

## Phase 02 update

Node 24.15.0/Python 3.14.7 foundation verified locally; use root README.md for actual setup. Dependencies installed inside npm workspace and backend/.venv. PostgreSQL/Compose intentionally not required until phase 03. No additional user installation needed. Current exact versions are in package-lock.json and backend/requirements-dev.lock.

## Phase 06 update

One-command local startup: backend/.venv/Scripts/python scripts/dev.py after locked dependency installation. It starts PostgreSQL, applies migrations/reference seeds and starts app services; credentials stay in ignored root .env. Real account-browser verification uses backend/tests/run_postgres.py --browser with disposable data. No extra user installation or hosted account required for local use. Production SMTP/HTTPS configuration remains required before deployment. Development mail files are local account codes, not external email.

Phases 09/10 add no installation dependencies or external services. Existing local frontend/API/PostgreSQL setup serves /chords and /metronome. Sign in only to persist private custom chords. Browser-native audio requires an explicit Play/Start action and audible output device. No microphone is needed for these two tools. Metronome background/sleep playback can be interrupted; restart after suspension. See architecture/METRONOME.md and phase reports for verification limits.

Phase 11: apply Alembic head 0007_patterns, then run python -m app.modules.catalog.seeds in backend using the existing configured local environment; scripts/dev.py does both. Seed inserts twelve original exercises and never overwrites managed edits or repopulates archived rows. Sign in at /patterns. No new environment variables, accounts with external providers or paid services. Manager-only endpoints are documented in docs/architecture/STRUMMING.md; ordinary accounts cannot assign themselves a role. Full manager UI is Phase 15.

Phase 12: Alembic head 0008_songs and existing reference seed command install the bundled 91 song entries (85 popular metadata-only plus six originals). scripts/dev.py runs migration/seed, preserving existing rows and withdrawals. JSON packs are included as package data; no runtime network, provider key or paid subscription required. Sign in at /songs. See docs/architecture/SONGS.md for manager-only staged API/CLI import and rights prerequisites. Metadata access does not grant popular text/arrangements. Migration preserves duplicate historical favorites as notes before unique owner/song favorites; do not run production downgrades casually. Password hash parameters remain unchanged; at most two memory-heavy jobs per API process and two browser test workers reduce local memory pressure. Multiple deployed API workers need aggregate memory sizing in deployment preparation.


## Phase 13 addition

No new prerequisite, service, hosting provider or package is required. Existing `scripts/dev.py` applies additive migration 0009 before API startup. Restart the API after this update; keep the existing local database and credentials. Open `/practice` while signed in for sessions/routines/goal settings. Public tuner/chords/metronome remain available to guests. See ../architecture/PRACTICE.md for usage and retry/background-time behavior. No external deployment performed in this phase. Small-memory machines may set NODE_OPTIONS=--max-old-space-size=384 for lint; Vitest now defaults to one worker. Run heavy verification sequentially if other applications leave little memory. This does not weaken password hashing or production validation.


Phase 14 adds migration 0010 and /progress plus dashboard summaries. No new application package/provider. The normal launcher applies migrations. Locked Linux test dependencies and disposable PostgreSQL were used for verification while native Windows Python imports remain subject to Application Control. CI additionally exports only the synthetic-account progress screenshot for visual verification, never local mail/credentials or personal data.


Current workstation: existing Docker service chord-house-api-local-1 was migrated to 0010_progress and restarted. Local readiness and /progress registration were verified. This avoids changing Windows policy and preserves the user's existing Docker setup/database. The native Python launcher remains subject to its separate Application Control issue. No additional user setup is currently required to open /progress on the running local frontend.


## Phase 15 local update

Run the normal backend Alembic upgrade to `0011_content` and `python -m app.modules.catalog.seeds` before restarting the API. Existing accounts and private records are retained. Reference seeds preserve manager edits and archives. Use the trusted local `python -m app.modules.content_management.operator ACCOUNT_UUID content_manager --confirm` command only for an explicitly selected, email-verified account; refresh its session. No new dependencies or providers. See ../architecture/CONTENT-OPERATIONS.md for complete API, rights, report, migration and rollback notes. Native Windows Application Control may block installed Python extensions on this machine; the existing Linux Docker backend remains the verified alternative without changing that policy.


## Phase 17 current checkout and security prerequisites

Activation verified 2026-11-11 after the owner-approved Docker restart. Open http://127.0.0.3:3002/account and register a separate preview account. Local Edge completed actual JSON download and verified account deletion/session revocation. The original app at http://127.0.0.1:3000 and Phase 16 preview at http://127.0.0.2:3001 were restored too. See PHASE-17-REPORT.md for evidence and environment recovery details. Keep Docker and the current frontend launchers running while using these local apps.

Current branch/worktree is codex/phase-17 at .artifacts/phase17-worktree, based on completed Phase 16. The original dirty checkout and earlier preview are retained. The current separate preview uses project chord-house-preview, frontend http://127.0.0.3:3002, API loopback 8002 and DB 5435. Run npm ci, then python scripts/dev-preview.py from this checkout with Docker running. Register a separate preview account; no personal accounts or uncommitted local-song/player code is copied. Preserve its ignored .env.preview and persistent volumes. The launcher refuses replacement credentials for an existing volume and leaves occupied listeners alone. First image build needs network; no new application package/provider is required. The phase report gives actual local readiness rather than assuming it.

No new schema migration is introduced; apply existing head 0012 and reference seeds on a normal current single-checkout upgrade. Native Windows SQLAlchemy/psycopg binaries remain subject to Application Control; the supported app runtime here is Linux Docker. Pure-Python SQLAlchemy tooling was used only in ignored artifacts to generate/check actual OpenAPI and run available static/unit checks; it does not weaken OS policy or change locked application drivers.

Production now requires exact non-empty HTTPS origins, configured certificate-verified SMTP and a limited, non-owner/no-CREATE/no-role-membership DB login. Use administrative/migration credentials only in migration/seed jobs; do not supply an unpooled migration URL to the production API process. Trust forwarded scheme/IP only from the actual proxy addresses, never wildcard trust. Development Compose credentials are loopback setup credentials, not a production template. Review provider/contact/location/backup retention/deletion-after-restore before public use. See SECURITY-AND-PRIVACY.md for constraints and ADR-0023 for decisions.

Expired codes/sessions/rate windows and local captured codes are cleaned at startup/every 15 minutes; python -m app.modules.security.maintenance --confirm is an explicit operator alternative. Do not run tests against personal/production data. Dependency checks: npm run security:audit (zero runtime findings; only the documented dev advisory graph permitted until 2026-12-11), and isolated pip-audit 2.10.1 over requirements-dev.lock. CI records scan evidence; no user mail/export/database is uploaded.
