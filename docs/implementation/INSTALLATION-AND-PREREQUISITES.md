# Installation and prerequisites

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
