# Phase 14 report

Date: 2026-11-09. Scope: PRA-011–018, UNI-016–020, UNI-025. Phase 13 prerequisite verified from its report, c5955b9 and successful runs 42575743593/42575750451. Owner explicitly accepted Monday weeks, any positive saved time qualifying a day, local-midnight splitting and recalculation in current profile timezone. Source requirements/blueprint are task reference inputs; the owner's request authorizes execution of Phase 14 only.

## Outcome

Implemented: derived saved-practice day/week/month/all-time totals, streaks, current goal progress, daily chart/table, linked-session rankings, weekly review/reflection, structured original roadmap and per-owner/instrument self-reported milestone completion. Compact dashboard summary and protected /progress route. Goal settings/pause continue using Phase 13 versioned records. UTC intervals and current profile timezone drive all aggregates; no aggregate counters, invented sessions or automatic playing assessment. Refresh/navigation/focus/visibility and periodic reload recalculate current data. Unsaved review notes suspend refresh to preserve edits.

Migration 0010 adds only roadmap_completions and practice_weekly_reviews with ownership, keys/checks and account cascades. Goal/session rows remain unchanged. Existing cookie/CSRF/Origin checks and no-store policy apply. No owner identifier accepted in new requests. New application contracts, pure calendar domain, application service, routes and reusable frontend Progress feature are documented in PROGRESS.md and ADR-0020. UNI-025 MAY selected; no scoped MAY silently omitted. No Phase 15 implementation.

Tested locally: Linux Python 3.14 container with locked dependencies and isolated disposable PostgreSQL: python -m pytest tests => 57 passed in 25.07 seconds; python -m mypy app => 51 source files passed; Ruff check/format => 75 files pass. Frontend npm test => 403 passed, seven files. Production build passed. Final hosted/browser results recorded below after execution. Migration up/down/up and Alembic drift checked on disposable database, never personal data.

Verified domain/repository evidence: 23/25-hour DST days, fractional-offset zones and midnight allocation conservation, exact microsecond totals, week/streak boundaries, zero/unsaved exclusion, correction/delete/timezone recomputation, historical/current/paused goal versions, private review/roadmap isolation, idempotent marks, instrument/skill adaptation, account cascades, invalid weeks and guest access. Browser journey exercises actual session correction/deletion through Practice and dashboard summaries, goals, roadmap persistence, review text, second-account isolation, responsive overflow and axe checks at 375/768/1280 pixels.

Blocked/unverified: native Windows SQLAlchemy remains blocked by Application Control. No security policy altered. Locked dependencies in isolated Linux permit backend verification. Initial Windows lint/browser processes intermittently terminated or PowerShell stack-overflowed; a clean no-profile shell produced a successful production build. Native browser initially exited before running its test; final CI and screenshot evidence recorded below. No external deployment, hardware/audio accuracy or new popular-song rights claimed.

## Changes and traceability

Backend progress_domain/models/schemas/service and original roadmap, composition/routes, additive migration 0010; tests test_progress.py/test_progress_domain.py plus migration head update. Frontend full/compact Progress, dashboard/navigation and Practice availability copy; generated API contract; CSS for totals/chart/accessible table. CI uploads only the synthetic-account progress screenshot for visual QA, not mail/tokens or personal data. Documentation includes owner-approved assumptions, architecture, requirements, traceability, setup, README, ADR-0020 and progress guide.

SRS PRA-011–018, UNI-016–020 fulfilled; UNI-025 selected. Cross-cutting validation/ownership/auth/CSRF/accessibility/local operation and tests applied. A-009/A-010 accepted by explicit owner reply; prior proposed history preserved. Historical goals use period-close versions as documented engineering policy; today/current week use now. Roadmap guidance is original, not expert-certified. Completed marks are self-reported and separate from time statistics. Rankings use linked sessions only; routine activity links do not infer individual practice time.

## Failures and remaining work

Initial type checks exposed direct SongRecord title/artist access and a reused loop variable; fixed to approved detail fields and distinct variables. Clock injection needed a constructor correction; fixed before integration tests. Guest test without database correctly received 503 rather than 401; configured disposable database and the negative authorization test passes. Initial wide parallel verification was avoided after prior memory pressure. Windows native package block persists; Linux container and CI verification keep it distinct from feature correctness.

Manual use: sign in, open Progress or Workspace. Save sessions in Practice to populate results; edit/delete sessions and refresh to see recalculation. Change timezone/profile instrument/skill to adapt calendar/roadmap. Set/pause targets in Practice. Review completed Monday-start weeks, save private reflections, and mark/unmark roadmap milestones. Exact limitations and local runtime status follow below. No content-rights, deployment or physical-device verification attempted.

Exit gate: final hosted browser results below determine completed edit/delete/dashboard and boundary gates.

## Git status

Focused codex/phase-14 from codex/phase-13. Actual commit/push/PR and final results follow. No merge/force push/visibility changes. Preserved user next-env dev-types diff and untracked Requirements.md, Chord-House-Architecture-Blueprint.md, Chord-House-Codex-Master-Prompt.md and PROJECT_GAP_ANALYSIS.md. Private .env/mail/database and ignored test artifacts excluded. Next prompt PHASE-15.md; stop here.
