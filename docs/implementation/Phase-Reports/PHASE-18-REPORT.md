# Phase 18 revised execution — 12 November 2026

## Outcome

Implemented the revised phase in `codex/phase-18-reconciled`, isolated at `D:/RAYYAN/Projects/Chord-House/.artifacts/phase18-revised-worktree`. Application code under final automated qualification: **c0e6f7795dc2fb1c9f4d6163a80aba0b6dfec421**. Phase 19 has not started.

**Browser qualification is running; the final exit gate is pending.** This report does not yet claim Phase 18 completion. The old 80/86 result is historical and preserved verbatim in PHASE-18-LEGACY-2026-11-12-REPORT.md.

The working revised preview is **http://127.0.0.3:3003**, API 8002/database 5435. The original checkout and 3002 frontend were not overwritten. Preview credentials, accounts and persistent database/mail volumes were reused; no personal database was copied. A local SQL snapshot was taken before migration 0013. Shared recordings are mounted read-only from the original songs directory.

### What the owner can use

- All 24 supplied songs: 4 English, 7 Urdu and 13 Hindi, with recordings and original-format lyrics; open registration and shared reading/playback for every signed-in account.
- The preserved listening-room player: play/pause, seek, rewind/forward 10 seconds, volume, repeat, timing, buffering and error feedback; readable lyric/chord/capo spacing and text-size/practice controls.
- Trusted operator folder scan, idempotent sync and explicit rename mapping, preserving song UUIDs, known artist metadata and private favorites/collection links.
- Existing guest tuner/metronome/public chords, and signed-in private workspace, custom chords/patterns, practice/routines/goals/timezone progress, training/reminders and account security/accessibility from the reconciled Phase 17 baseline.

## Implemented changes

The baseline is 7d157b3 (successful Phase 17 plus earlier quality work), reconciled with the owner-approved original root song/player changes using a scoped three-way patch. Listing conflicts retained the lightweight live-rights projection and new local availability; CSS conflicts retained both training and player styles. Source fingerprints cover **81 original files; zero changed**, including all **24 MP3s and 24 lyric files**. Local source hashes and the original patch remain excluded from Git in `.artifacts/phase18-revision`.

Migration **0013_song_assets** adds relational stable active asset bindings: source kind/key, revision, per-file key/checksum/size/type and unverified media-rights status. Metadata stays in PostgreSQL; recording/text bytes stay on disk. No cloud adapter, upload, paid service, provider account or source removal was performed.

The application storage protocol has no HTTP/ORM dependency. Its local adapter checks containment/links, type header, bounds and UTF-8 validity, preserves text line endings/BOM handling, and reads at most 64 KiB at a time. Authenticated audio GET/HEAD/ranges return 200/206/416 with correct length/content-range and private/no-store. Two-account reading is shared intentionally; writing remains operator/manager-only and personal resources stay isolated.

Operator `scan` is a dry run; `sync` is idempotent; `rename` requires a stable UUID and explicit destination. Invalid supported assets and normalized collisions produce diagnostics. A possible rename of a missing source is reported rather than silently reimported as a duplicate. Missing folders/outages never delete stable records or favorites. Catalogue GET requests no longer import files. Fresh-process CLI execution now registers all referenced ORM metadata, preventing the real preview startup FK error discovered during activation.

Listing uses one asset-binding join, plus a request-scoped checksum/availability cache for shared file keys. No cross-request grant/content cache was introduced. The performance fixture has 5,000 metadata identities sharing one original lyric file; it is not a 5,000-recording or public-network throughput benchmark.

Player design remains intact. Source changes/unmount release media; pending play and stale promises are guarded, seek IDs are unique across player instances and invalid media has recovery feedback. Generated tuner fixtures bind a stable navigator mediaDevices object across restarts. Audio lookahead is 300 ms instead of 150 ms to survive brief foreground scheduling stalls; strict native-clock phase and voice-count assertions remain in place. Physical accuracy targets were not changed.

## Verification

Hosted run: https://github.com/rayyanhasan899/Chord-House/actions/runs/43246546543

| Check | Evidence/status |
| --- | --- |
| Locked install, formatting, ESLint, TypeScript | Passed on c0e6f77 |
| Frontend Vitest | **473 passed, 12 files** |
| Production build | Default Linux builder passed; local Windows Webpack build passed |
| OpenAPI/client drift | Passed |
| Ruff check/format and strict mypy | Passed; 80 application modules |
| Full PostgreSQL pytest | Passed; final job log/count recorded after browser job completes |
| Fresh upgrade, migration drift and downgrade/upgrade | Included in the passing PostgreSQL gate; head 0013_song_assets |
| 5,000-record authenticated search | Passed the retained five-second gate in the hosted run; exact measurements in phase18-search.json |
| Dependency/security checks | Passed using existing audit policy; historical development-only advisory exception remains documented |
| Full three-engine/mobile-emulated browser qualification | Running; pending final outcome |
| Actual local preview smoke | Passed in installed Chrome: 24 songs (4/7/13), real MP3 metadata and advancing playback, authenticated 206 range, guest 401, exact source lyric comparison, no horizontal overflow at 390 px |
| Original source preservation | 81 SHA-256 comparisons passed; no source/media changed |

The actual Chrome smoke observed a 224.525-second recording, readyState 4 and advancing playback. This proves browser media playback/control behavior; it does not certify a physical speaker. Screenshots mask supplied lyrics. Its synthetic account and captured verification mail were removed; shared songs remained.

Generated plucks still cover 80 noisy/harmonic/decayed combinations across low bass/guitar and 32/44.1/48/96 kHz. Maximum observed unit-test error is **3.0030601675 cents**, under the unchanged five-cent gate. Thirty-minute deterministic timing produced 901/3,601/9,002 scheduled ticks at 30/120/300 BPM; maximum phase error was **2.724e-10 seconds**. Lookahead includes future ticks. Neither simulation measures acoustic output latency.

## Traceability and decisions

Original assigned scope remains all 42 IDs: NFR-PER-001–007, NFR-REL-001–006, NFR-COMP-001–005 and TST-001–024. Shared original song/auth/privacy/accessibility requirements also apply. ADR-0025 and SONG-ASSETS.md document the storage boundary and operator workflow; ADR-0024 remains the quality baseline.

CHG-SONG-001/002: shared authenticated reading, guest denial and private ownership tests. 003/004: three-language folders, audio/text variants, validation, exact text and layout tests. 005: player controls, pending/source-change lifecycle and independent labels. 006: stable UUID/favorite across mapped rename/replacement/outage. 007: local contract/adapter and protected range behavior. 008: local manifest/validation/idempotency; cloud sync remains Phase 19. 010: truthful unverified media source status and secret/media exclusion. 012: tested local operator commands and honest handover. CHG-SONG-009/011 online cutover/paired restore remain Phase 19; retaining originals and the preview SQL snapshot do not claim those online gates complete.

## Failures, recovery and limits

Earlier local Windows runs hit restricted temporary-cache paths, low-memory worker termination and intermittent session 401s. D: process-local TEMP/TMP and a bounded Node heap were used; no security assertion, expiry tolerance or password setting was weakened. A targeted local identity/song diagnostic subsequently passed 2/2, without reproducing a rejected-clock sample. The final hosted regression is independent evidence, not a retroactive pass for earlier attempts.

Initial import tests needed explicit sync fixtures after GET imports were removed; the audit assertion was updated to include the real local-assets-import event. Preview startup exposed missing standalone FK metadata registration, now covered by a subprocess regression. The first local 5,000-row offset measurement exceeded five seconds under workstation load; SQL joins and request-local shared-asset checks were corrected. Only the final hosted result is a passed budget claim.

C: fell below 100 MB and Docker stopped responding during a build. The ordinary restart failed; using the owner's prior restart authorization, only verified Docker processes and the docker-desktop WSL engine were recovered. Original Chord House and previously running Devtreck services were restored; Ubuntu and unrelated stopped services were not restarted. A 276 MB rebuildable NuGet package cache was moved to `D:/RAYYAN/Projects/Chord-House/.artifacts/host-cache/nuget-packages`, with its original `C:/Users/rayya/.nuget/packages` path preserved as a junction. Keep that target while the junction exists. No personal files were deleted. The revised preview reuses installed dependencies and read-only source/migration mounts, avoiding repeated heavy builds.

Popular-song distribution permission remains **unverified**. Legacy hard-coded owner permission assertions are corrected for local records, not treated as evidence. Production media delivery rejects unverified permission; externally hosted distribution is a Phase 19 prerequisite. No scraped replacements or fabricated licenses were introduced.

Exact physical GuitarTuna/E2/A2 comparison, real microphone calibration, speakers/headphones, branded Safari and physical phones remain unverified. Generated audio and mobile emulation cannot establish those results. Background/sleep continuity is limited by browsers and documented. No arbitrary tuner correction was applied.

## Git and next phase

Branch: codex/phase-18-reconciled. Application revision: c0e6f77. Private repository pushes succeeded after review of the exact outgoing files; one earlier automatic-review push rejection was resolved by confirming the authorized existing private destination and reviewing the precise code/test/documentation payload. No supplied recordings, raw lyrics, credentials, dumps or personal exports were pushed.

Remote inspection shows historical PR 18 was already merged by the owner; this execution does not rewrite that history or merge changes itself. The revised PR and final browser outcome will be recorded below. Original checkout remains codex/phase-15 with its prior user changes intact. Future work must use the reconciled revision, not the stale historical phase-18 worktree.

Next prompt: PHASE-19.md, only when requested. Online storage/deployment has not been started.
