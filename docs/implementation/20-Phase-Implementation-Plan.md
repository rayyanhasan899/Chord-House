# 20-phase implementation plan

Planning finalized 2026-11-08; no implementation phase executed. Read Requirements-Analysis.md and Architecture-and-Database-Design.md with unchanged source documents. All statuses are planned.

1. Core song catalogue includes popular English, Urdu and Hindi songs, with Roman Urdu/Hindi variants. English UI is independent of song language. No fixed small sample-only cap.
2. Guests can use tuner, metronome and public chord library. Personal records require authentication; guest access to other catalogue areas remains proposed, not approved.
3. Secure server-managed cookie sessions; revocation, expiration, logout and backend authorization required.
4. Fully usable local application plus deployment preparation; no paid core dependency; provider selection requires current evaluation.
5. Guitar presets: E2 A2 D3 G3 B3 E4; Drop D D2 A2 D3 G3 B3 E4; DADGAD D2 A2 D3 G3 A3 D4. Preserve bass E1 A1 D2 G2 and re-entrant ukulele G4 C4 E4 A4.
6. Custom chords and patterns are private; public sharing excluded initially.
7. Saved sessions drive minutes, daily/weekly goals, history and consecutive-day streaks in user timezone; edits/deletions must recompute.
8. English default UI, future translation seams; multilingual song data now.

Copyright clarification: the request to assume popular lyrics are freely reproducible cannot establish permission. SON-021–028 and SRS §1.2/2.2 require verified rights. Full lyrics, including Roman transliterations, are a desired capability gated by explicit rights, territory and provider terms. Missing rights must never be reported as acquired. Metadata and authorized links remain useful, and chord arrangements require their own provenance. No comprehensive free popular-song lyrics source has been verified. Source and coverage acquisition are release risks, not solved engineering tasks.

## Sequence and dependencies

Submit 01 through 20 sequentially, one prompt at a time. Critical path: 01→02→03→04→05→06→07→12→13→14→16→17→18→19→20. Audio 08–11 depends on 06 and catalogue contracts; 12 depends on 09/11; 15 depends on 12–14. Conceptually isolated audio utilities, content research and UI primitives can run in parallel after contracts stabilize, but this workflow does not authorize concurrent phase execution. Security and tests start with each feature; 17/18 harden and audit. Initial CI belongs in 02, deployment hardening in 19.

## Phase 01: Baseline and technical design

Goal/scope and deliverables: Reconcile sources and decisions; approve module contracts, entity ownership, threat boundaries, content acquisition gates and measurable acceptance criteria. Establish readiness without application scaffolding.

Owner: `architecture`. Prerequisites: planning package reviewed. Risk: Source conflicts and unverified content rights. Acceptance and exit gate: Reviewed baseline, proposed policy choices identified, every requirement assigned. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 12/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: ARC-001, ARC-002, ARC-003, ARC-004, ARC-005, ARC-006, ARC-007, ARC-008. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 02: Repository foundation

Goal/scope and deliverables: Scaffold Next.js TypeScript Tailwind shadcn/ui and FastAPI projects; environment examples, scripts, lockfiles, Ruff/type checks, ESLint/Prettier, Vitest/Pytest/Playwright setup and initial CI.

Owner: `tooling`. Prerequisites: prior phase exit gates through 01; use module dependencies above. Risk: Runtime/dependency compatibility. Acceptance and exit gate: Fresh checkout setup and foundational checks pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 1/20 (higher is harder). Model: **GPT 6.1 SOL — Light**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: NFR-MNT-001, NFR-MNT-002, NFR-MNT-003, NFR-MNT-004, NFR-MNT-005, NFR-MNT-006, NFR-MNT-007, NFR-MNT-008. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 03: Backend foundation

Goal/scope and deliverables: Implement FastAPI factory, composition, validated configuration, redacted structured logging, consistent errors, health/readiness, SQLAlchemy PostgreSQL connections, Alembic and OpenAPI.

Owner: `backend/core`. Prerequisites: prior phase exit gates through 02; use module dependencies above. Risk: Connection lifecycle and migration drift. Acceptance and exit gate: Health/error integration tests and clean migration pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 4/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: NFR-OBS-001, NFR-OBS-002, NFR-OBS-003, NFR-OBS-004, NFR-OBS-005, API-001, API-002, API-003, API-004, API-005, API-006, API-007, API-008, API-009, API-010. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 04: Domain and database

Goal/scope and deliverables: Define framework-independent domain invariants and repositories; reviewed entities, foreign keys, indexes, owner constraints and versioned migrations; repeatable lawful reference seeds. Add feature tables only when justified.

Owner: `domain/persistence`. Prerequisites: prior phase exit gates through 03; use module dependencies above. Risk: Cross-module coupling and deletion semantics. Acceptance and exit gate: Domain tests and PostgreSQL constraint/migration tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 11/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: DAT-001, DAT-002, DAT-003, DAT-004, DAT-005, DAT-006, DAT-007, DAT-008, DAT-009, DAT-010. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 05: Identity and accounts

Goal/scope and deliverables: Implement registration/password hashing, normalized emails, opaque server sessions, logout/revocation, expiration/renewal, CSRF, rate limits, roles, profile/preferences, onboarding APIs, password change/reset and verification adapter. Establish deletion/export contracts.

Owner: `identity`. Prerequisites: prior phase exit gates through 04; use module dependencies above. Risk: Session attacks and cross-user access. Acceptance and exit gate: Auth, revocation, CSRF, throttling and two-user isolation tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 19/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: ACC-001, ACC-002, ACC-003, ACC-004, ACC-005, ACC-006, ACC-007, ACC-008, ACC-009, ACC-010, ACC-011, ACC-012, ACC-013, ACC-014, ACC-015, ACC-016, ACC-017, ACC-018, ACC-019, ACC-020, ACC-021, ACC-022, ACC-023, ACC-026, ACC-029, ACC-030, ACC-031, ACC-032, ACC-033, ACC-034, ACC-035, ACC-036, ACC-037, ONB-001, ONB-002, ONB-003, ONB-004, ONB-005, ONB-006. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 06: Frontend and design system

Goal/scope and deliverables: Build English application shell, public/protected routes, login/register/onboarding, responsive navigation, typography/tokens, accessible forms and all feedback states; generated OpenAPI client and auth integration.

Owner: `frontend`. Prerequisites: prior phase exit gates through 05; use module dependencies above. Risk: Cookie forwarding and inaccessible controls. Acceptance and exit gate: Build, contract checks and login/onboarding browser journey pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 3/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: UI-001, UI-002, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008, UI-009, UI-010, UI-011, UI-012. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 07: Dashboard and workspace

Goal/scope and deliverables: Implement dashboard, editable profile/preferences, tasks CRUD/filter/dates/priorities, private collections, favorites and linked learning notes. Integrate real available data; add later feature links only when working.

Owner: `personal_workspace`. Prerequisites: prior phase exit gates through 06; use module dependencies above. Risk: Missing ownership filters and premature dashboard aggregates. Acceptance and exit gate: Task/profile/collection journeys and two-user isolation pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 7/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: DSH-001, DSH-002, DSH-003, DSH-004, DSH-005, DSH-006, DSH-007, DSH-008, SON-038, SON-039, SON-040, SON-041, SON-042, SON-043, SON-044, TSK-001, TSK-002, TSK-003, TSK-004, TSK-005, TSK-006, TSK-007, TSK-008, TSK-009, TSK-010, TSK-011, TSK-012, TSK-013, TSK-014, UNI-024. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 08: Instrument tuner

Goal/scope and deliverables: Implement guest tuner with explicit microphone start/stop, local YIN or validated detector, confidence/harmonic rejection, note/cents math, smoothing, needle/text feedback and cleanup. Standard guitar/bass/re-entrant ukulele plus Drop D and DADGAD.

Owner: `frontend/tuner`. Prerequisites: prior phase exit gates through 07; use module dependencies above. Risk: Low E1 capture, harmonics and device variability. Acceptance and exit gate: Generated-tone suite plus measured real-device reference evidence; disclose any unverified device gate. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 20/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: TUN-001, TUN-002, TUN-003, TUN-004, TUN-005, TUN-006, TUN-007, TUN-008, TUN-009, TUN-010, TUN-011, TUN-012, TUN-013, TUN-014, TUN-015, TUN-016, TUN-017, TUN-018, TUN-019, TUN-020, TUN-021, TUN-022, TUN-023, TUN-024, TUN-025, TUN-026, TUN-027, TUN-028, TUN-029, TUN-030, TUN-031, TUN-032, TUN-033, TUN-034, TUN-035, TUN-036, TUN-037, TUN-038, TUN-039, TUN-040, TUN-041, TUN-042, TUN-043, TUN-044, TUN-045, TUN-046, TUN-047, TUN-048, TUN-049, TUN-050, TUN-051, TUN-052. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 09: Chord library and audio

Goal/scope and deliverables: Search instrument-aware chords/voicings; accessible diagrams, interactive fretboard, finger/open/muted strings, difficulty/guidance, private custom chord CRUD and browser synthesis. Validate musical reference data.

Owner: `catalog/chords`. Prerequisites: prior phase exit gates through 08; use module dependencies above. Risk: Incorrect voicings or string ordering. Acceptance and exit gate: Diagram/audio/math tests and private custom-chord journey pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 13/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: CHR-001, CHR-002, CHR-003, CHR-004, CHR-005, CHR-006, CHR-007, CHR-008, CHR-009, CHR-010, CHR-011, CHR-012, CHR-013, CHR-014, CHR-015, CHR-016, CHR-017, CHR-018, CHR-019, CHR-020, CHR-021, CHR-022, CHR-023, CHR-024, CHR-025, CHR-026, CHR-027, CHR-028, CHR-029. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 10: Metronome

Goal/scope and deliverables: Guest metronome with bounded BPM, tap tempo, meter, accents, sound/volume, visual beats and lookahead Web Audio scheduling; start/stop and lifecycle cleanup. Document background limits.

Owner: `frontend/metronome`. Prerequisites: prior phase exit gates through 09; use module dependencies above. Risk: Timer drift and suspended audio contexts. Acceptance and exit gate: Long-duration timing, suspension and cleanup tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 5/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: MET-001, MET-002, MET-003, MET-004, MET-005, MET-006, MET-007, MET-008, MET-009, MET-010, MET-011, MET-012, MET-013, MET-014. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 11: Strumming patterns

Goal/scope and deliverables: Catalogue/filter patterns, readable strokes/rhythm, speed/loop/accent/highlight playback, chord combination, favorites and private custom-pattern editor/CRUD. Add server-authorized content-management use cases; full admin UI in 15.

Owner: `catalog/patterns`. Prerequisites: prior phase exit gates through 10; use module dependencies above. Risk: Rhythm validation and duplicated schedulers. Acceptance and exit gate: Pattern validation, playback and ownership tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 6/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: STR-001, STR-002, STR-003, STR-004, STR-005, STR-006, STR-007, STR-008, STR-009, STR-010, STR-011, STR-012, STR-013, STR-014, STR-015, STR-016, STR-017, STR-018, STR-019, STR-020. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 12: Song discovery and learning

Goal/scope and deliverables: Deliver substantial expandable English/Urdu/Hindi catalogue; language/script variants and Roman aliases, search/filter/pagination, artist/details, tuning/difficulty/capo, verified arrangements, diagrams/transposition, favorites/collections. Build idempotent staged import, provenance and rights gates. Full lyrics only with verified permission; authorized links and available metadata/chords otherwise.

Owner: `catalog/songs`. Prerequisites: prior phase exit gates through 11; use module dependencies above. Risk: Popular-song rights and provider coverage. Acceptance and exit gate: All three languages and Roman search tested; content inventory records real learning coverage and blocked items honestly. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 16/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: SON-001, SON-002, SON-003, SON-004, SON-005, SON-006, SON-007, SON-008, SON-009, SON-010, SON-011, SON-012, SON-013, SON-014, SON-015, SON-016, SON-017, SON-018, SON-019, SON-020, SON-021, SON-022, SON-023, SON-024, SON-025, SON-026, SON-027, SON-028, SON-029, SON-030, SON-031, SON-032, SON-033, SON-034, SON-035, SON-036, SON-037. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 13: Practice sessions and routines

Goal/scope and deliverables: Implement session start/pause/end/save/history/edit/delete, instrument/song links, notes, daily/weekly goals, timers, routine builder/duplicate/reorder/player and guided tool integration. Validate durations and prevent duplicate saves.

Owner: `practice`. Prerequisites: prior phase exit gates through 12; use module dependencies above. Risk: Double-counting and background timer loss. Acceptance and exit gate: Session/routine CRUD, retry and ownership integration/browser tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 10/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: PRA-001, PRA-002, PRA-003, PRA-004, PRA-005, PRA-006, PRA-007, PRA-008, PRA-009, PRA-010, PRA-019, PRA-020, PRA-021, PRA-022, UNI-001, UNI-002, UNI-003, UNI-004, UNI-005. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 14: Progress and roadmap

Goal/scope and deliverables: Derive totals/goals/streaks from saved sessions; timezone/DST/midnight/week boundaries, edit/delete recomputation, roadmap milestones and instrument/skill adaptation, history/charts/dashboard summaries and weekly review.

Owner: `practice/progress`. Prerequisites: prior phase exit gates through 13; use module dependencies above. Risk: Timezone changes and stale derived values. Acceptance and exit gate: Boundary/property tests and edit/delete dashboard journeys pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 15/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: PRA-011, PRA-012, PRA-013, PRA-014, PRA-015, PRA-016, PRA-017, PRA-018, UNI-016, UNI-017, UNI-018, UNI-019, UNI-020, UNI-025. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 15: Administration and content operations

Goal/scope and deliverables: Role-protected catalogue CRUD, tuning/chord/pattern/song management, import review/deduplication, draft/publish/archive, provenance/rights validation, reports/corrections and redacted audit trail. Never auto-publish unreviewed provider material.

Owner: `content_management`. Prerequisites: prior phase exit gates through 14; use module dependencies above. Risk: Unauthorized publishing and expired rights. Acceptance and exit gate: Role matrix, report privacy and rights-withdrawal tests pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 14/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: ADM-001, ADM-002, ADM-003, ADM-004, ADM-005, ADM-006, ADM-007, ADM-008, ADM-009, ADM-010, ADM-011, ADM-012. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 16: Cross-feature completion

Goal/scope and deliverables: Complete integrated learning journeys, transition trainer, local ear training with feedback/difficulty, optional deterministic routines, chord challenge/note finder/section practice where permitted, reminder preferences/timezone/permission fallbacks and consistent navigation.

Owner: `integration`. Prerequisites: prior phase exit gates through 15; use module dependencies above. Risk: Neglected differentiators and unreliable background reminders. Acceptance and exit gate: Cross-feature browser journeys and denied-notification behavior pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 8/20 (higher is harder). Model: **GPT 6.1 SOL — Medium**. Reason: bounded setup or feature integration with established contracts.

Primary SRS IDs: UNI-006, UNI-007, UNI-008, UNI-009, UNI-010, UNI-011, UNI-012, UNI-013, UNI-014, UNI-015, UNI-021, UNI-022, UNI-023, NTF-001, NTF-002, NTF-003, NTF-004, NTF-005, NTF-006, NTF-007. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 17: Security privacy accessibility

Goal/scope and deliverables: Review and fix threats, all private-resource isolation, session/CSRF/CORS/rate limits, HTTPS configuration, export/deletion/retention, log redaction, dependency findings and keyboard/screen-reader/WCAG 2.2 AA behavior.

Owner: `security`. Prerequisites: prior phase exit gates through 16; use module dependencies above. Risk: Privacy leaks and destructive lifecycle errors. Acceptance and exit gate: Negative security tests, deletion/export and accessibility evidence pass. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 18/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: ACC-024, ACC-025, ACC-027, ACC-028, NFR-SEC-001, NFR-SEC-002, NFR-SEC-003, NFR-SEC-004, NFR-SEC-005, NFR-SEC-006, NFR-SEC-007, NFR-SEC-008, NFR-SEC-009, NFR-SEC-010, NFR-SEC-011, NFR-SEC-012, NFR-SEC-013, NFR-SEC-014, NFR-PRI-001, NFR-PRI-002, NFR-PRI-003, NFR-PRI-004, NFR-PRI-005, NFR-PRI-006, NFR-PRI-007, NFR-PRI-008, NFR-UX-001, NFR-UX-002, NFR-UX-003, NFR-UX-004, NFR-UX-005, NFR-UX-006, NFR-UX-007, NFR-UX-008, NFR-UX-009. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 18: Quality compatibility performance

Goal/scope and deliverables: Run complete domain/API/repository/component/E2E/contract/migration suite, supported browser/device audio checks, generated noisy/harmonic/low-bass signals, long timing runs, responsive/performance/search profiling and regression fixes.

Owner: `quality`. Prerequisites: prior phase exit gates through 17; use module dependencies above. Risk: Synthetic tests masking real hardware defects. Acceptance and exit gate: Document measured results and remaining device gaps; critical failures resolved. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 17/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: NFR-PER-001, NFR-PER-002, NFR-PER-003, NFR-PER-004, NFR-PER-005, NFR-PER-006, NFR-PER-007, NFR-REL-001, NFR-REL-002, NFR-REL-003, NFR-REL-004, NFR-REL-005, NFR-REL-006, NFR-COMP-001, NFR-COMP-002, NFR-COMP-003, NFR-COMP-004, NFR-COMP-005, TST-001, TST-002, TST-003, TST-004, TST-005, TST-006, TST-007, TST-008, TST-009, TST-010, TST-011, TST-012, TST-013, TST-014, TST-015, TST-016, TST-017, TST-018, TST-019, TST-020, TST-021, TST-022, TST-023, TST-024. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 19: CI CD and deployment

Goal/scope and deliverables: Harden initial CI with reproducible checks/builds and migration gates; evaluate current free providers, environment/secrets, same-origin routing, deployment manifests, HTTPS, smoke checks, backup/restore rehearsal and rollback. Deploy only with accounts/authorization available.

Owner: `operations`. Prerequisites: prior phase exit gates through 18; use module dependencies above. Risk: Free-tier expiration, cold starts and data loss. Acceptance and exit gate: Local fresh setup verified; hosted status and recovery evidence explicitly reported. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 9/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: BUD-001, BUD-002, BUD-003, BUD-004, BUD-005, BUD-006, BUD-007, BUD-008, BUD-009, BUD-010, DEP-001, DEP-002, DEP-003, DEP-004, DEP-005, DEP-006, DEP-007, DEP-008, DEP-009, DEP-010, DEP-011, DEP-012, DEP-013, DEP-014. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Phase 20: Release audit and handoff

Goal/scope and deliverables: Audit all 450 SRS IDs and added decisions, close evidence gaps, document user/admin/developer guides, content limitations, release notes and recovery, review repository/PR status and publish final acceptance checklist.

Owner: `release`. Prerequisites: prior phase exit gates through 19; use module dependencies above. Risk: False completion despite content/device gaps. Acceptance and exit gate: No unresolved critical requirement; distinguish releasable from blocked gates. Include applicable unit, integration and browser evidence; no success without execution.

Difficulty rank: 2/20 (higher is harder). Model: **GPT 6 ASTRA — Medium**. Reason: high uncertainty, cross-boundary correctness or release verification.

Primary SRS IDs: DOC-001, DOC-002, DOC-003, DOC-004, DOC-005, DOC-006, DOC-007, DOC-008, DOC-009, DOC-010. Cross-cutting authorization, accessibility, local operation, tests and documentation apply in every phase.

## Difficulty order

Use ranks in the phase entries (1 easiest, 20 hardest); sequence is independent of rank. Model labels are the user-requested planning labels, not verified selector availability. Choose the closest available equivalent if absent.

## Risks and release policy

Substantial popular-song content with full lyrics cannot be guaranteed at zero cost. Acquire lawful coverage in parallel with engineering and maintain a content gap register. Do not call a metadata-only inventory a completed guitar-learning library. Exact numerical catalogue acceptance remains unapproved. Tuner ±5 cents is the SRS controlled-condition target, requiring actual measurements; bass microphones may filter E1. Record device limitations, not false guarantees. Free hosting can sleep/expire and needs restore testing. Keep dependencies minimal for solo maintenance. Public release requires all mandatory behavior and documented accepted scope decisions, legal review, isolation and audio evidence.


Easiest → hardest phase order: 02, 20, 06, 03, 10, 11, 07, 16, 19, 13, 04, 01, 09, 15, 14, 12, 18, 17, 05, 08.
