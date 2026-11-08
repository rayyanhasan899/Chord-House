# Phase 04 report

Date: 2026-11-08
Scope: domain and database foundation.

## Implemented
Framework-independent immutable tuning/note domain invariants and repository protocols; owner-scoped SQL note CRUD and published tuning reads; minimal UUID account anchor; instrument/tuning/string and private note ORM mappings; reviewed 0002_domain_foundation migration with FK/check/unique/index/time constraints; explicit non-overwriting reference seeds (four instruments/eight presets); metadata registration and detailed ERD/module/entity/deletion design. ADR-0009 and A-023/024 record boundaries.

Private notes are the small necessary ownership proof slice, not an early workspace feature/API. No unused future feature tables created. Identity anchor has no login credentials yet. Seed input comes from SRS/accepted guitar tuning definitions, no copyrighted songs or user data.

## Exact verification
- backend/.venv/Scripts/python -m ruff check backend: exit 0.
- backend/.venv/Scripts/python -m ruff format backend: final run 26 files unchanged/1 formatted; subsequent check recorded below.
- backend/.venv/Scripts/python -m mypy backend/app: exit 0, 19 source files.
- From backend, .venv/Scripts/python tests/run_postgres.py: exit 0, 14 passed, no skips or warnings, PostgreSQL 17.9.
- git diff --check: exit 0, generated frontend line-ending notice only.

Tests verify domain bounds and framework independence; all required tuning pitches including re-entrant ukulele/low bass; owner A/B read/update/delete isolation and forged-owner creation rejection; own updates/deletes; note timestamp awareness, orphan/empty-note rejection, duplicate catalogue keys/string positions, invalid pitch rejection, account→note cascade, instrument delete restriction, shared data preservation, seed idempotency/archive preservation, migration upgrade/downgrade/re-upgrade/drift and existing API/lifecycle regression checks. First mypy run exposed result-rowcount typing and tuple-length inference; corrected using SQL RETURNING and explicit variable-length tuple type. Initial long-line errors fixed by formatter/docstring correction. No failing check hidden.

## Requirement evidence
DAT-001–010 addressed with slice-specific evidence and design. DAT-004 authenticated actor resolution remains Phase 05; repository requires a trusted actor UUID and rejects owner mismatch, but no authentication is claimed. DAT-009 account deletion cascade tested for notes; future lifecycle rules documented, complete account workflow remains later. Other private resources and local-time UI need their own implementation/evidence. Traceability retains these limitations.

## Not attempted and risks
No new frontend/UI, auth/session, private API, song/chord catalogue content or practice workflows. Existing frontend generated type-path change remains untouched outside phase commit. Frontend local tests not repeated because no frontend code changed; CI runs regressions. Cross-row tuning cardinality uses domain validation rather than SQL triggers; future admin writes must validate whole aggregates. Downgrade removes phase tables/data and is only safe on reviewed development/disposable databases. Audit retention duration remains a release decision.

## Git, security and usability
Branch codex/phase-04, stacked on codex/phase-03 while prior PRs remain open. Original input documents and frontend working-tree changes preserved. No secrets or personal data added. Test runner removes only its isolated database. Git/PR/hosted evidence follows actual results; no merge authorized.

You can still use the foundation frontend, API docs and health checks. You can now migrate the five-table reference/ownership schema and explicitly seed the instrument/tuning references using root README commands. There is no note-editing screen or new learner-facing functionality yet. No manual software installation required.

Exit gate: domain and actual PostgreSQL constraint/migration tests passed. Next: docs/implementation/phase-prompts/PHASE-05.md.
