# Phase 13 report

Date: 2026-11-08. Scope: Practice sessions, private routines, guided tool integration and goal settings. Phase 12 engineering delivery verified at 1472c76/609268b and its report/PR; popular content rights and tuner hardware caveats remain unchanged. Original source documents were read as task inputs, separately from the owner's request to execute this phase and list all phase purposes. No Phase 14 work or merge authorized.

## Outcome

Implemented:

- `/practice` protected English UI, navigation and availability copy. Start/pause/resume/end/review/save; count-up or target timer; instruments, optional song/private chord/chord symbol, focus and notes. Saved history, page-local search, metadata edits, explicit time correction, physical delete/discard and loading/empty/error/success/retry states.
- Server active intervals exclude paused time, preserve subsecond segments, survive navigation/refresh/background throttling and clamp countdown completion at its exact deadline. No autosave or inferred attendance. One unfinished session/account, start keys, immutable saved transitions, versions and owner locks prevent duplicate creation/time. Deleted Start retries return 410 through a minimal non-content ledger. Future/overlapping saved intervals are rejected; 1 second–24 active hours, explicit confirmation above four hours.
- Private routine create/list/read/edit/duplicate/delete and ordered activities with up/down controls; player advances by active time. Session snapshots survive template edit/delete. Missing required song/pattern links require repair before starting/duplication. Guided chord diagram/metronome and synchronized pattern/chord/click player reuse existing local audio engines with explicit play and cleanup. Song/tuner open separately; no microphone capture from Practice.
- Daily/weekly goal targets and pause settings are versioned/effective-dated. No statistics, streaks, roadmap, goal completion claim or aggregate counters. Migration 0009 adds five tables, indexes/checks/FKs without rewriting prior user data. OpenAPI/client refreshed. No package or provider dependency added.
- All 20 phase purposes documented in PHASE-PURPOSES.md and listed for the owner before implementation.

Tested (exact commands/results): final execution evidence is recorded below after completion.

Verified: PostgreSQL migration up/down/up and drift checks run only on an isolated disposable container. Backend tests exercise lifecycle, retries, concurrent starts, microsecond pause exclusion, target completion after five simulated background hours, time correction/overlap/zero/long guards, private links, session/routine/goal ownership, goal history, account cascades, CSRF and cache policy. Browser verification uses its isolated API/database, not local personal accounts.

Blocked: no Phase 13 prerequisite missing. Popular-song lyrics/arrangements still require actual grants; tuner physical low-string calibration remains unverified from earlier phases.

Not attempted: Phase 14 progress calculations/calendar decisions, Phase 15 admin UI, public sharing, external deployment, microphone/physical guitar accuracy, automatic playing assessment. PRA-021 MAY guided integration selected; UNI-005 MAY deterministic recommendations explicitly not selected now, reconsidered in Phase 16. No paid AI.

## Changes and traceability

Backend practice domain/models/contracts/service/routes, model registration/composition/cache policy, reviewed migration and focused test suite. Frontend practice clock, forms, editors, sources, goals, guided tools and page; existing metronome accepts initial tempo; typed API/401 handling and signed-in navigation updated. Existing Vitest suite bounded to one worker after reproducible local memory exhaustion, without reducing assertions. Documentation: ADR-0019, PRACTICE guide, requirements/architecture/assumptions/traceability/setup and phase purpose overview.

SRS: PRA-001–010, PRA-019–022, UNI-001–004. PRA-011/018 setting/pause portion explicitly included; Phase 14 owns derived results. UNI-005 MAY deferral recorded independently. Cross-cutting private authorization, CSRF, validation, accessibility, local operation and contract checks apply.

ADR-0019 records engineering choices. A-009/A-010 proposed calendar/historical timezone decisions remain for Phase 14; captured original timezone/UTC evidence does not silently accept them. No additional major product decision blocks this phase.

Security/privacy/content: every private resource filters authenticated owner, including linked private chords/patterns; serializers omit owner data. Mutations serialize per account, stale updates return 409, cookie/Origin/CSRF dependencies reused; no browser credential storage. Minimal retry ledger cascades with account and contains no session content. Goal edits preserve sessions. Session delete removes snapshot/notes/intervals. No environment secrets, private mail, local database/test artifacts or root user documents committed. Popular metadata links do not imply licensed text/arrangements.

## Failures and remaining work

Initial parallel verification on the memory-constrained host: existing password capacity test failed safely with 503 HashingError while other processes used memory; lint and multi-worker Vitest also exhausted memory. No hashing parameters/security guard changed. Sequential backend run subsequently passed all 46 tests. Bounded Vitest to one worker; full 403 tests passed. Lint passed with NODE_OPTIONS=--max-old-space-size=384. Initial new frontend contract aliases referred to schema base types omitted from OpenAPI; fixed to Pick from emitted creation types. New migration required explicit PostgreSQL dialect import; corrected before execution. Formatting/lint/type errors were corrected before final gates.

Manual use: restart through existing launcher, sign in and open /practice. Pause for breaks; review elapsed idle time after sleep. Only Save adds history. Correct accidental time explicitly. Audio is synthesized and requires user initiation; separate song/tuner tabs manage their own playback. No hardware, hearing, hosting or rights verification is claimed by automated tests. Progress summaries/streaks/calendar choices next in Phase 14.

Exit gate: final results below determine session/routine CRUD, retry/ownership browser integration status.

## Git status

Branch codex/phase-13 from codex/phase-12. Actual commit, push, PR and hosted terminal checks recorded after execution. No merge. Preserved original three untracked root documents and pre-existing frontend/next-env.d.ts dev-types imports outside commits. Next prompt PHASE-14.md; do not auto-start.

Continuation 2026-11-09: Windows Application Control now rejects installed native SQLAlchemy/mypy files (DLL load failed), blocking final local contracts/backend startup/browser reruns. No security policy altered. Docker restarted successfully. Prior local 46-test PostgreSQL run/build passed before policy blockage; first browser journey timed out on incorrect Start button locator, corrected to Start metronome (and Add routine activity). Final hosted checks are required for the latest missing-chord fix. PROJECT_GAP_ANALYSIS.md is additional user work preserved untracked.
