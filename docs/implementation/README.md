# Chord House implementation workflow

Planning only, finalized 2026-11-08. No application phase has executed and there are no completion reports.

Read [requirements analysis](Requirements-Analysis.md), [architecture/database design](Architecture-and-Database-Design.md), [roadmap](20-Phase-Implementation-Plan.md), [assumptions](Assumptions.md), [traceability](Requirement-Traceability-Matrix.md) and [prerequisites](INSTALLATION-AND-PREREQUISITES.md). The root Requirements.md and architecture blueprint remain unchanged source references. Explicit later user decisions are recorded in the analysis and ADRs.

Submit [PHASE-01.md](phase-prompts/PHASE-01.md) next. Use [the index](PHASE-PROMPTS-INDEX.md) for all 20 files. Submit one phase at a time and wait for its verified report. Reports go in Phase-Reports; REPORT-TEMPLATE is a template, not evidence of completion.

To resume in a new chat, open this repository, supply the selected prompt and ask the agent to inspect current files, git status/log and prior reports. Verify claims against traceability evidence and actual command results. Never infer implementation from a plan or checked template. Preserve uncommitted source files. No automatic phase advancement, merges or deployment-account creation.


## Current state after Phase 01

Phase 01 baseline established; see ../architecture/PHASE-01-BASELINE.md and Phase-Reports/PHASE-01-REPORT.md. Next execution prompt is phase-prompts/PHASE-02.md. No application exists yet. Every phase completion response must briefly state which functionalities are present and what the owner can actually use.

## Current state after Phase 02

Frontend and backend skeletons now run locally. See root README.md for setup/check commands and Phase-Reports/PHASE-02-REPORT.md for verification. Next: phase-prompts/PHASE-03.md. Initial planning/Phase 01 statements above describe historical state.

## Current state after Phase 03

Backend liveness/readiness, safe structured errors/logs, PostgreSQL connection/transactions and Alembic workflow are available. Root README contains commands. No learner feature added in this phase. Next: phase-prompts/PHASE-04.md.

## Current state after Phase 04

Domain/schema and explicit reference seeding are available; ERD/deletion rules are in ../architecture/DOMAIN-AND-DATA-MODEL.md. No new user-facing feature yet. Next prompt: phase-prompts/PHASE-05.md.

## Current state after Phases 05 and 06

Working account APIs and browser account flows now available. Start with the root README quick start or open the running localhost:3000. Reports PHASE-05-REPORT.md and PHASE-06-REPORT.md distinguish verification and remaining later-phase scope. Next prompt: phase-prompts/PHASE-07.md.

## Current state after Phases 09 and 10

Public chords with private custom-chord management and a guest metronome are implemented. See PHASE-09-REPORT.md and PHASE-10-REPORT.md for actual verification. Next prompt: phase-prompts/PHASE-11.md. Earlier current-state sections above are historical; Phase 08 physical calibration remains open.

## Current state after Phase 11

Sign-in pattern library, private editor/CRUD/favorites and synchronized chord/metronome playback are available. Shared content-management API is implemented; full manager UI remains Phase 15. See Phase-Reports/PHASE-11-REPORT.md for actual tests. Next prompt: phase-prompts/PHASE-12.md. Earlier state sections are historical; tuner physical calibration is still open.

## Current state after Phase 12

Song discovery and learning pages, private catalog saves/collections and manager staged imports are implemented. Bundled content: 85 popular metadata-only entries plus six original learning songs; real popular lyrics/arrangements remain unlicensed and unavailable. See SONG-CONTENT-INVENTORY.md/JSON and PHASE-12-REPORT.md. Owner confirmed sign-in access and no licensed source. Next prompt: phase-prompts/PHASE-13.md. Prior state sections are historical; physical tuner calibration remains open.
