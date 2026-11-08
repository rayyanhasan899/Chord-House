# Execute Phase 18 — Quality compatibility performance

Work in the actual Chord House repository. Implement this phase only, then stop. Do not automatically start the next phase.

Read Requirements.md and Chord-House-Architecture-Blueprint.md, docs/implementation/Requirements-Analysis.md, Architecture-and-Database-Design.md, Assumptions.md, Requirement-Traceability-Matrix.md and all relevant prior Phase-Reports. Inspect AGENTS.md, current implementation, git status/branch/remotes/latest commits and runtime availability first. Preserve uncommitted user work. Confirm prerequisites from the roadmap and state a short execution checklist. Phase 17 must be complete where applicable; never invent missing reports.

## Scope, deliverables and boundaries

Run complete domain/API/repository/component/E2E/contract/migration suite, supported browser/device audio checks, generated noisy/harmonic/low-bass signals, long timing runs, responsive/performance/search profiling and regression fixes.

Owning module: quality. Relevant SRS IDs: NFR-PER-001, NFR-PER-002, NFR-PER-003, NFR-PER-004, NFR-PER-005, NFR-PER-006, NFR-PER-007, NFR-REL-001, NFR-REL-002, NFR-REL-003, NFR-REL-004, NFR-REL-005, NFR-REL-006, NFR-COMP-001, NFR-COMP-002, NFR-COMP-003, NFR-COMP-004, NFR-COMP-005, TST-001, TST-002, TST-003, TST-004, TST-005, TST-006, TST-007, TST-008, TST-009, TST-010, TST-011, TST-012, TST-013, TST-014, TST-015, TST-016, TST-017, TST-018, TST-019, TST-020, TST-021, TST-022, TST-023, TST-024. Also apply SRS §§5, 7–13, 14, 16–17 and all cross-cutting privacy, validation, accessibility and test requirements to changed behavior. Consult traceability for shared requirements and detailed full requirement text. Database changes require reviewed Alembic migrations, constraints, indexes and ownership authorization. UI changes include mobile/tablet/desktop, keyboard labels and loading/empty/error/success/permission states. Keep real use cases and working interactions; no fake catalogue, dead buttons or fabricated verification.

The accepted product baseline is English UI; English/Urdu/Hindi song data and Roman variants; guest tuner/metronome/public chords; private personal data and custom chords/patterns; server-managed cookie sessions; standard/Drop D/DADGAD guitar and standard bass/re-entrant ukulele; timezone-aware saved-session progress; complete local operation and optional free deployment. Popular lyrics and Roman transliterations require verified rights, never assume availability. Apply per-component provenance to metadata, arrangements and text. A comprehensive song-learning catalogue is a core deliverable, with actual coverage recorded honestly.

Do not implement unrelated later-phase work. A small prerequisite is allowed only if necessary, documented and verified. Do not silently defer MUST/SHOULD behavior or omit MAY rows; record selection/deferral separately. Review proposed assumptions when they affect behavior; ask only for material unresolved product decisions. Keep domain independent of frameworks and ORM, use application contracts/repositories and composition, and process browser audio locally.

## Verification and exit

Specific acceptance gate: Document measured results and remaining device gaps; critical failures resolved.
Risk to test explicitly: Synthetic tests masking real hardware defects.
Run relevant formatting, lint, type checks, unit/component tests, PostgreSQL repository/migration/API integration tests and Playwright critical journeys. Use deterministic audio fixtures where relevant, and real-device evidence separately. Include negative authorization and cross-user cases for each private resource. Check OpenAPI/client drift and builds/startup when changed. Fix regressions; report exact commands, exit results and unavailable prerequisites. Do not claim hardware, deployment or content-rights verification from mocks.

## Documentation, Git and report

Update assumptions with history, ADRs when justified, traceability evidence and setup/architecture/API/user documentation. Write docs/implementation/Phase-Reports/PHASE-18-REPORT.md using REPORT-TEMPLATE.md. Distinguish implemented, tested, verified, blocked and not attempted. Include changes, IDs, exact check results, failures, security notes, remaining work and manual actions.

Use a focused codex/phase-18 branch or continue an appropriate existing branch after inspection. Review diff for secrets, unrelated edits and generated/private data. Commit only phase-owned files, push to the existing private remote and open/update a PR if access permits; report actual branch/hash/push/PR. Never force push, discard changes, expose credentials, change visibility or merge without explicit approval. If tools fail, continue safely locally and report the precise blocker.

Completion response: outcome, changed modules, SRS IDs, exact test/build results, limitations, assumptions/ADRs, report path and Git/PR status, manual actions and next prompt PHASE-19.md. Stop after this phase.


At completion, briefly tell the owner which functionalities are present and what they can actually use. Clearly separate working features from planned or unverified behavior.
