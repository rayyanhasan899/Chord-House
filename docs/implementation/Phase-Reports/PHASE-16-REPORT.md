# Phase 16 report

Date: 2026-11-10. Scope: cross-feature completion, integration module. Only Phase 16 is implemented; Phase 17 is not started.

## Outcome

Implemented: authenticated Training navigation/hub, configurable current/next chord transitions and randomized difficulty sequences, private self-assessments, timed self-reported chord challenge, generated-tone note/interval/chord-quality questions with selectable difficulty/feedback, correctly pitched fretboard note finder, approved-text section pacing/looping, explainable routine suggestions and opt-in timezone-aware reminders with denied/unsupported fallback. Practice links preserve focus/song, keep a started server timer across Training navigation and require explicit End/Save for credit. Existing tuner/chords/metronome/patterns/workspace/song/practice/progress features are retained.

Prerequisites: inspected prompt, source SRS/blueprint, requirements/architecture/assumptions/traceability, relevant Phase 13–15 reports, repository instructions, branch/status/remotes and runtime. Phase 15 engineering gate is verified at b2b6589, hosted run 42780364212 (403 frontend/63 backend/12 browser tests). Its email-verification/manager-provisioning exception is unrelated to ordinary training and remains unchanged. Execution checklist: preserve user work; map requirements/MAYs; implement integration/data/audio; verify private/negative/calendar/browser cases; document/review/commit/push/PR; stop before 17.

Tested checkpoint: hosted run 42872478553 at 8ce45f6 passed npm format:check, lint, typecheck, test (419 tests in 9 files), build; npm contracts:check; Ruff check/format; mypy (66 source files); pytest (84 tests). Browser harness production build passed, 13/15 journeys passed; the two failures are documented below and are not reported as success. Rerun 42873732935 at de9ad50 is in progress at this checkpoint. Final executed gate and exact evidence follow in the completion addendum.

Local tests: generated-signal/question/fretboard/sequence and cancellation-race coverage is included in the 419 frontend cases. Native schema/calendar-only pytest ran 18 tests successfully; native pure-Python mypy checked 66 app files. Windows Application Control blocks the installed native SQLAlchemy extension and compiled mypy; no security setting was disabled. Real PostgreSQL/migration/API tests run on Linux. Local Docker initially stalled, later recovered without restarting unrelated services.

Verified locally: the separate preview image built successfully from the existing locked dependencies; launcher `python scripts/dev-preview.py --backend-only` exited 0, both preview containers healthy, API readiness HTTP 200. Foreground preview launcher was then started hidden; Next reports ready on 127.0.0.2:3001 and `/training` returned HTTP 200. These HTTP checks prove startup, not authenticated browser journeys. Preview database is separate; the original personal database was not migrated. Existing original Chord House and devtreck services were preserved.

Blocked/limited: no new popular-song lyrics/arrangement/recording rights; no closed-browser notification guarantee; no new physical-device audio/tuner calibration. Prior low-E/A tuner evidence remains open. None of these is represented as verified. Not attempted: production deployment/provider changes, merge, unrelated local song-player work, manager-role provisioning, Phase 17, recording playback/time stretching, service workers/push/email/cron reminders.

## Changes and traceability

Backend integration owns schemas, pure calendar domain, application service, persistence and authenticated routes. Core composition explicitly registers models/router and private no-store responses. Reviewed migration `0012_integration` follows `0011_content`: assessments with owner/client-key uniqueness and owner index, version-checked preferences and composite owner/date delivery claims. Account cascades remove all three. Existing migration tests upgrade/downgrade/check ORM drift on disposable PostgreSQL; no destructive migration is run on personal data.

Frontend training owns pure question/pitch/sequence functions, explicit local-audio lifetime and seven tool panels; Shell adds navigation and reminder host. Practice/song links connect workflows without implicit credit. Generated OpenAPI/types come from the actual app, not handwritten schema stubs. New tests are backend test_integration.py/test_integration_domain.py, frontend training.test.ts/training-audio.test.ts and e2e/training.spec.ts. Preview Docker/Compose/launcher is a small prerequisite to make the isolated branch usable while preserving the dirty original checkout.

| Requirements | Implementation/evidence |
| --- | --- |
| UNI-006–009 | Multiple chords/current-next/configurable interval/self-assessment; sequence unit tests, private repository/API tests and full learning journey |
| UNI-010 MAY selected | Difficulty-filtered randomized published shapes, no adjacent repeats; pure tests/journey |
| UNI-011–015 | Browser-local note/interval/chord questions, three selectable levels and explanation; 9 mode/level cases, exact pitch and audio-resume cancellation tests, browser reference tone/answer |
| UNI-005 MAY selected after Phase 13 deferral | Current instrument/skill/active daily goal/recent compatible saved material; review then explicit routine Save; repository and linked-song browser checks |
| UNI-021 MAY selected | 5–300-second self-reported clean-change challenge; explicit completion/count save, no implicit practice credit |
| UNI-022 MAY selected | String/fret/octave/frequency with alternate guitar, bass and re-entrant ukulele; pure mappings and browser A4=440 Hz |
| UNI-023 MAY selected with content boundary | Approved text-line bounds, loop/once, tempo/generated cues, current grants/revalidation/expiry. Recorded-song playback/time stretching unselected without rights; no popular-content success claim |
| NTF-001–003 | Disabled defaults, explicit enable/disable/local time/weekdays/current timezone; ownership/version/concurrent date-claim and DST/gap/window tests |
| NTF-004 MAY selected; NTF-005–007 | Explained explicit permission action, denied/unsupported in-app fallback, all tools usable, generic practice-only notification; two real-browser fallback journeys |

Assumptions A-013/A-032/A-033 and ADR-0022 document reminder delivery, selected MAYs, self-report/retention and preview isolation. The optional owner reminder-delivery question is unanswered; visible-tab behavior was explicitly stated as an engineering assumption after a response opportunity. No user approval is fabricated. Requirements analysis, architecture/database/deletion notes, traceability, README and installation/training/API guide are updated.

Security/privacy/rights: cookie sessions plus CSRF/Origin guards reused; owner comes from session, unknown owner fields rejected, cross-owner assessment deletion returns 404 and lists/preferences/suggestions are scoped. Concurrency keys and tombstones prevent duplicate or resurrected assessment saves. Delete clears private JSON while retaining minimal UUID/key/hash/time until account deletion. Delivery dates also persist until account deletion. No shared custom-content endpoint, audio upload or persistent ear-answer record. Audio/permission actions require interaction and stop on navigation/hide; stale resume failure cannot stop a newer round. Only explicitly saved Practice intervals affect totals/goals/streaks. Texts require existing per-component grants; no scraping or presumed Roman-transliteration rights. The catalog remains 85 popular metadata identities plus six separately labeled original exercises, not newly acquired popular full lyrics.

## Failures and remaining work

Initial bootstrap run 42859932781 exposed missing generated integration client types and DTO literal/type narrowing; corrected using actual Linux app-generated contracts and validated DTO construction. Run 42872478553 then found an assessment Delete button whose accessible name omitted contiguous visible text; fixed to include “Delete assessment”. Its auth regression cleared cookies then attempted a link while the new reminder host could already detect 401 and remove the stale page; changed the test to assert protected navigation recovers to sign-in regardless of which request detects expiry. No permission denial or account-isolation assertion was removed. First preview listener bound 127.0.0.1 despite the intended isolated hostname; corrected to explicitly run Next on 127.0.0.2 and verified HTTP 200 there. Only our own preview process tree was restarted.

Manual use: open http://127.0.0.2:3001/training and register a new preview account. No personal data/accounts or unfinished local song-player changes have been copied. The original app stays on its existing hostname/database. To restart, run `python scripts/dev-preview.py` from this worktree; preserve ignored `.env.preview` with its volume. See TRAINING.md for mail/stop instructions. Browser sound/permission behavior should be tried on the owner's device separately. Reliable closed-browser delivery would need a future explicit product/infrastructure decision; it is outside the documented initial contract. Popular playable-content acquisition remains a recorded project gap.

Exit gate at checkpoint: pending final browser rerun. Completion addendum records the actual result; do not infer a pass from implemented code.

## Git status

Branch `codex/phase-16`, isolated worktree `D:/RAYYAN/Projects/Chord-House/.artifacts/phase16-worktree`, base fb57736 on `codex/phase-15`. Implementation commits bde7c57, 8ce45f6 and de9ad50 pushed to the existing private origin. No force push/merge/visibility change. PR and final tested commit are recorded below when actually available.

Original checkout remains on codex/phase-15 with the existing modified backend config/catalog/workspace/tests, frontend songs/styles/contracts/e2e/next-env and untracked source documents/local song modules/player/tests/songs directory intact. They are excluded from phase commits. Root private .env/.local-mail are not copied or staged. Preview credentials/mail/test artifacts remain ignored. Next dev's worktree next-env import rewrite is generated, not user work; it is excluded from phase commits.

Next prompt: `docs/implementation/phase-prompts/PHASE-17.md`, only after owner instruction. Stop after this phase.
