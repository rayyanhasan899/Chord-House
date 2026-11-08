# Execute Phase 12 — Song discovery and learning

Work in the actual Chord House repository. Implement this phase only, then stop. Do not automatically start the next phase.

Read Requirements.md and Chord-House-Architecture-Blueprint.md, docs/implementation/Requirements-Analysis.md, Architecture-and-Database-Design.md, Assumptions.md, Requirement-Traceability-Matrix.md and all relevant prior Phase-Reports. Inspect AGENTS.md, current implementation, git status/branch/remotes/latest commits and runtime availability first. Preserve uncommitted user work. Confirm prerequisites from the roadmap and state a short execution checklist. Phase 11 must be complete where applicable; never invent missing reports.

## Scope, deliverables and boundaries

Deliver substantial expandable English/Urdu/Hindi catalogue; language/script variants and Roman aliases, search/filter/pagination, artist/details, tuning/difficulty/capo, verified arrangements, diagrams/transposition, favorites/collections. Build idempotent staged import, provenance and rights gates. Full lyrics only with verified permission; authorized links and available metadata/chords otherwise.

Owning module: catalog/songs. Relevant SRS IDs: SON-001, SON-002, SON-003, SON-004, SON-005, SON-006, SON-007, SON-008, SON-009, SON-010, SON-011, SON-012, SON-013, SON-014, SON-015, SON-016, SON-017, SON-018, SON-019, SON-020, SON-021, SON-022, SON-023, SON-024, SON-025, SON-026, SON-027, SON-028, SON-029, SON-030, SON-031, SON-032, SON-033, SON-034, SON-035, SON-036, SON-037. Also apply SRS §§5, 7–13, 14, 16–17 and all cross-cutting privacy, validation, accessibility and test requirements to changed behavior. Consult traceability for shared requirements and detailed full requirement text. Database changes require reviewed Alembic migrations, constraints, indexes and ownership authorization. UI changes include mobile/tablet/desktop, keyboard labels and loading/empty/error/success/permission states. Keep real use cases and working interactions; no fake catalogue, dead buttons or fabricated verification.

The accepted product baseline is English UI; English/Urdu/Hindi song data and Roman variants; guest tuner/metronome/public chords; private personal data and custom chords/patterns; server-managed cookie sessions; standard/Drop D/DADGAD guitar and standard bass/re-entrant ukulele; timezone-aware saved-session progress; complete local operation and optional free deployment. Popular lyrics and Roman transliterations require verified rights, never assume availability. Apply per-component provenance to metadata, arrangements and text. A comprehensive song-learning catalogue is a core deliverable, with actual coverage recorded honestly.

Do not implement unrelated later-phase work. A small prerequisite is allowed only if necessary, documented and verified. Do not silently defer MUST/SHOULD behavior or omit MAY rows; record selection/deferral separately. Review proposed assumptions when they affect behavior; ask only for material unresolved product decisions. Keep domain independent of frameworks and ORM, use application contracts/repositories and composition, and process browser audio locally.

## Verification and exit

Specific acceptance gate: All three languages and Roman search tested; content inventory records real learning coverage and blocked items honestly.
Risk to test explicitly: Popular-song rights and provider coverage.
Run relevant formatting, lint, type checks, unit/component tests, PostgreSQL repository/migration/API integration tests and Playwright critical journeys. Use deterministic audio fixtures where relevant, and real-device evidence separately. Include negative authorization and cross-user cases for each private resource. Check OpenAPI/client drift and builds/startup when changed. Fix regressions; report exact commands, exit results and unavailable prerequisites. Do not claim hardware, deployment or content-rights verification from mocks.

## Documentation, Git and report

Update assumptions with history, ADRs when justified, traceability evidence and setup/architecture/API/user documentation. Write docs/implementation/Phase-Reports/PHASE-12-REPORT.md using REPORT-TEMPLATE.md. Distinguish implemented, tested, verified, blocked and not attempted. Include changes, IDs, exact check results, failures, security notes, remaining work and manual actions.

Use a focused codex/phase-12 branch or continue an appropriate existing branch after inspection. Review diff for secrets, unrelated edits and generated/private data. Commit only phase-owned files, push to the existing private remote and open/update a PR if access permits; report actual branch/hash/push/PR. Never force push, discard changes, expose credentials, change visibility or merge without explicit approval. If tools fail, continue safely locally and report the precise blocker.

Completion response: outcome, changed modules, SRS IDs, exact test/build results, limitations, assumptions/ADRs, report path and Git/PR status, manual actions and next prompt PHASE-13.md. Stop after this phase.


At completion, briefly tell the owner which functionalities are present and what they can actually use. Clearly separate working features from planned or unverified behavior.
