# Phase 15 report

Date: 2026-11-09. Scope: ADM-001–012, content_management. Phase 14 prerequisite confirmed from PHASE-14-REPORT.md and 1b43947/fd43808. Source requirements and blueprint are reference inputs; the owner's request authorizes execution of Phase 15 only. No Phase 16 work.

## Outcome

Implemented: role-protected `/admin`, structured catalogue editors for instruments/tunings/chord voicings/patterns/songs and component grants, draft/publish/archive, optimistic revisions, immediate song/component withdrawal, staged import review/history/deduplication, private `/reports` and correction queue, redacted audit. Managed reference data feeds the guest tuner and shared chord library. Original 198 voicings and four instruments/eight presets are non-overwriting seeds, not newly acquired content. Song inventory remains 91 initial entries with the prior popular-content rights gaps.

Tested locally so far: `python -m pytest tests --tb=short` in the existing locked Linux runtime image against a separate disposable PostgreSQL 17.9 database: **63 passed in 35.77s**, exit 0. Includes migration fresh-up/down/up/drift, role matrix, user/private boundary, CSRF/Origin, report ownership, anonymization/cascade, revision conflicts, chord-tone validation, expiry and component withdrawal. `python -m mypy app`: 60 files passed, exit 0. `python -m ruff check --fix backend`: clean, exit 0 after formatting. `npm run lint`, `npm run typecheck`, `npm test`: exit 0, **403 tests**, seven files. `npm run build`: exit 0, 21 routes including /admin and /reports. Final exact validation, browser and hosted results will be appended after execution.

Verified: actual PostgreSQL and cookie-session API behavior, not mocked authorization. Backend native Windows mypy remains blocked by Application Control; existing Linux image supplies the locked runtime without changing security policy. Synthetic browser journey is implemented for review/publication refusal, private report/correction, permission state, explicit import commit, audit, three widths and axe; execution status follows below.

Blocked/unverified: no new popular-song rights acquired; 85 popular metadata identities still have no approved lyrics/arrangements. No real-device audio certification, external deployment or professional content review. Account role provisioning was explicitly requested for an existing account in the owner's reply; actual local result will be recorded without email/credential disclosure. No other user's role will be changed.

## Changes and traceability

Owning module: content_management domain, boundary schemas, service/repository contract, SQL adapter, routes, models, reference seeds and explicit operator CLI. Migration 0011 adds reference/report/audit tables and modification metadata to existing shared songs/patterns. Catalogue writes/imports/withdrawals record redacted actions atomically. Patterns recheck expiring grants on discovery/favorite/practice linkage; earlier management API publication also requires the rich grant. UI uses actual endpoints, native labeled controls, paged lists, failure recovery and preserved failed edits. Generated OpenAPI/client contracts, browser test and existing reference/API tests are updated.

ADM-001 shared/private distinction; ADM-002/003 role checks; ADM-004 instruments/tunings; ADM-005 voicings; ADM-006 patterns; ADM-007 song metadata/components; ADM-008 timestamps/actors/audit; ADM-009 lifecycle; ADM-010 structural/rights validation; ADM-011 corrections; ADM-012 report privacy. Relevant DAT/SEC/UI/API/TST requirements apply to the changed slice; no project-wide release certification is inferred. No scoped MAY rows exist; all scoped MUST/SHOULD rows are implemented with verification pending final browser gate.

ADR-0021 documents revision/lifecycle, reference adoption, privacy and retention choices. A-031 records these engineering assumptions without overwriting earlier decisions. Content operations guide covers UI, permissions, grants, stable identities, seeds, migration, API and local operator setup. Reports cascade on account deletion; audit actors become null. Report bodies, passwords, email, tokens and grant evidence never enter audit payloads. Reference reads redact actor IDs. Cookie/CSRF/Origin/session rate guards are reused.

## Failures and remaining work

Initial static checks caught list-method/type-name shadowing, a SQL typing narrowing issue, long lines and React initial-fetch scheduling; corrected. New tests initially used a nonexistent seed helper/wrong JSON wrapper; corrected to the actual original-song array. A first reference grant template used the word worldwide instead of the established `*` policy token; corrected before local seed rollout. No failed check is represented as passing. Final browser failures/remediation and local readiness will be recorded below.

Use: sign in as the selected manager and open Administration. Edit/create shared entries, save drafts, review permissions and publish, archive or withdraw; stage supplier packs and explicitly review/commit. Ordinary accounts can submit and track private content reports. Existing tuner/metronome/chords, private workspace, patterns, song learning, practice and progress remain available. Popular full lyrics remain unavailable absent grants. Additional instrument definitions extend tuner selection; practice/profile/chord synthesis retain baseline instrument families.

Exit gate: API role/privacy/rights tests pass; final browser/hosted gate pending at this report checkpoint. No Phase 16 implementation. Next prompt PHASE-16.md.

## Git status

Branch codex/phase-15 from codex/phase-14. Original untracked root source documents and the pre-existing frontend/next-env.d.ts change are preserved outside phase commits. Private .env/mail/database and ignored test artifacts are excluded. Actual commit/push/PR and final results follow below; no merge or force push authorized.


Local rollout (2026-11-10): retained personal database upgraded to 0011_content, normal seed completed with 210 managed references (four instruments, eight tunings, 198 voicings), API readiness returned 200 and /admin returned 200. Final local production build after the accessibility fix exited 0. Original next-env dev imports restored. The phase-owned disposable PostgreSQL container/volume and test network were removed; retained personal API/database and other projects were preserved. A newly present untracked songs/ folder is also preserved as user work.

Owner-selected account provisioning remains blocked: the corrected existing account is email-unverified. Automatic approval review rejected direct role mutation with the stated reason "blocked by policy". The supported operator command was then attempted and rejected the unverified account; no role changed and no email verification was fabricated. Manual action: verify the account at /verify, then run the already-authorized operator command. User email/UUID are deliberately excluded from this report.

Initial hosted run 42779452915 passed frontend, contracts, Ruff/mypy and 63 backend tests, plus 11 existing browser journeys. The new administration journey timed out locating the catalogue type selector. b2b6589 adds its explicit accessible name and asserts the synthetic manager role before proceeding. Final rerun status follows. PR https://github.com/rayyanhasan899/Chord-House/pull/15 targets codex/phase-14 and remains unmerged.


Final verified implementation (2026-11-10): b2b6589. Hosted push run 42780364212 passed both jobs. Exact exit-0 commands: npm run format:check; npm run lint; npm run typecheck; npm test (403 tests); npm run build; npm run contracts:check; python -m ruff check --config pyproject.toml . ../scripts/dev.py; python -m ruff format --config pyproject.toml --check . ../scripts/dev.py (87 files); python -m mypy app (60 files); python -m pytest (63 tests in 17.63s); python tests/browser_system.py (production build and all 12 Chromium journeys). New journey verifies refused unreviewed publication, draft/review/publish, private reporting and corrected status, user management denial, explicit import staging/review/commit, redacted audit and axe/no horizontal overflow at 375/768/1280 pixels. The selector fix resolved the observed failure. Existing three-minute metronome regression measured 361 clicks and maximum audio-schedule phase error 0.000000000 seconds, without claiming physical output accuracy.

Artifact 13746096908 was downloaded from the successful run. Visually inspected the 1280x4597 administration screenshot: catalogue, staged/published import, correction queue and audit sections render without clipping. Screenshot uses synthetic accounts/content only and remains ignored. No real user data was submitted to the browser test database. Local final production build also passed and the preexisting next-env imports were restored.

Phase 15 engineering exit gate met. All ADM-001–012 rows now have passing API/browser evidence. Account activation remains the explicit manual exception described above: verify the selected account before privileged role provisioning. Popular content-rights acquisition and prior physical-device gates remain separate, not hidden successes. No Phase 16 work. Final documentation-only commit records these results with CI skipped; tested implementation remains b2b6589.
