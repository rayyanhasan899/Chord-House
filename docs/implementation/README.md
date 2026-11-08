# Chord House implementation workflow

Planning only, finalized 2026-11-08. No application phase has executed and there are no completion reports.

Read [requirements analysis](Requirements-Analysis.md), [architecture/database design](Architecture-and-Database-Design.md), [roadmap](20-Phase-Implementation-Plan.md), [assumptions](Assumptions.md), [traceability](Requirement-Traceability-Matrix.md) and [prerequisites](INSTALLATION-AND-PREREQUISITES.md). The root Requirements.md and architecture blueprint remain unchanged source references. Explicit later user decisions are recorded in the analysis and ADRs.

Submit [PHASE-01.md](phase-prompts/PHASE-01.md) next. Use [the index](PHASE-PROMPTS-INDEX.md) for all 20 files. Submit one phase at a time and wait for its verified report. Reports go in Phase-Reports; REPORT-TEMPLATE is a template, not evidence of completion.

To resume in a new chat, open this repository, supply the selected prompt and ask the agent to inspect current files, git status/log and prior reports. Verify claims against traceability evidence and actual command results. Never infer implementation from a plan or checked template. Preserve uncommitted source files. No automatic phase advancement, merges or deployment-account creation.


## Current state after Phase 01

Phase 01 baseline established; see ../architecture/PHASE-01-BASELINE.md and Phase-Reports/PHASE-01-REPORT.md. Next execution prompt is phase-prompts/PHASE-02.md. No application exists yet. Every phase completion response must briefly state which functionalities are present and what the owner can actually use.

## Current state after Phase 02

Frontend and backend skeletons now run locally. See root README.md for setup/check commands and Phase-Reports/PHASE-02-REPORT.md for verification. Next: phase-prompts/PHASE-03.md. Initial planning/Phase 01 statements above describe historical state.
