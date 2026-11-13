# Phase 19 report

Date: 13 November 2026. Scope: private online song storage, safe folder migration
preparation and zero-dollar deployment preparation. **Exit gate: not met.**

## Outcome

Implemented: S3-compatible SongStorage adapter; local/object composition;
protected GET/HEAD range integration; request throttling and ongoing-session
checks; durable operator scan/dry-run/sync/status/resume/rollback/cleanup;
checksummed copy/verify/transactional active-reference cutover; rights evidence
bound to file hashes; matched active-media/database backup/restore commands;
production Compose/TLS manifests; pinned optional cloud dependencies and guides.

Provisioned on the existing **Free** Neon organization: project
`broad-sky-05894064`, Singapore, PostgreSQL 17, production branch
`br-sweet-band-az4blfcv`, private `chord-house-songs` bucket. Fixed 0.25 CU;
configured quotas 288,000 compute seconds, 4,000,000,000 transfer bytes and
500,000,000 database bytes. No paid plan/card/add-on/hosting activated.
Owner-only migration and separate operator/read-only storage credentials are
excluded from Git. Devtreck was not changed. See ADR-0026 for current limits.

Tested/verified:

| Check | Evidence and limits |
| --- | --- |
| Original storage-protocol fixtures | `python -m unittest discover -s tests -p test_object_storage.py -v`: 9/9 pass, exit 0; exact bytes, ranges, body closure, corruption, invalid keys and truncated reads |
| Ruff | `ruff check app tests/test_object_storage.py tests/test_cloud_catalog.py` and formatting; exit 0; checked after final code edits |
| Strict mypy | `python -m mypy app --no-incremental`; exit 0; checked after final code edits; no ORM/schema framework rewrite |
| Python syntax | `python -m compileall -q app`: exit 0 before final documentation edits |
| Actual provider test | Original 62-byte test text uploaded 200, downloaded 200; `Range: bytes=9-20` returned **206**, `Content-Range: bytes 9-20/62`, exact bytes; original CRLF/blank lines/tab retained; anonymous GET **403** |
| Account/provider configuration | Connector confirmed Free organization, private bucket and exact project/branch/region; no application database schema deployed |
| Source inventory | 24 MP3s / 97,110,816 bytes; 24 lyric files / 59,109 bytes; largest MP3 5,424,236 bytes; no source files moved, deleted or uploaded |

Actual provider evidence is in `.artifacts/phase19-provider-evidence.json` and
contains no credentials or supplied song text. Provider testing used short-lived
internal test requests, not production signed-URL delivery. It proves the
provider's real range/UTF-8/private-bucket behavior, not deployed FastAPI/player
authorization or a complete Python-adapter integration test.

Blocked: Docker daemon access is denied in this managed session; existing native
SQLAlchemy extension import is blocked by Windows Application Control. Shell
PyPI DNS access also failed; official checksum-verified pure-Python cloud wheels
were downloaded through the available network runtime and installed offline.
The initial SDK resolution conflict with python-dateutil 4 was corrected by
pinning compatible 2.9.0.post0. No security protection was disabled.

Not verified/not attempted: complete PostgreSQL/API/migration/browser regression,
paired dump/restore rehearsal, actual cloud playback from a clean deployed app,
new-song remote cutover/rename/favorites and two-account live-provider isolation.
New PostgreSQL lifecycle tests are delivered but not claimed as executed. The
prior Phase 18 WebKit timing failure remains open (85/86 historical browser
journeys); it was neither waived nor rewritten as a pass. No frontend/player
source was changed by Phase 19.

## Changes and traceability

The accepted base is `5b56091888db5aa7e9f25667ac00cd71299e331c` on
`codex/phase-18-reconciled`, containing the reconciled Phase 17 security/account,
learning, practice and accepted player work. Original root remains on
`codex/phase-15` with all preexisting changes. Local Phase 19 source is isolated
at `.artifacts/phase19-worktree` (a source archive, not a registered Git worktree).
Do not overwrite root with this source copy without controlled reconciliation.

| IDs | Implemented evidence / remaining acceptance |
| --- | --- |
| BUD-001-004, BUD-007-010 | Existing browser-local audio, no paid AI/Redis dependency and local adapter preserved; optional SDK/portable port; documented caps/local startup |
| BUD-005-006 | Free organization and official quotas checked; hosting eligibility/mail path still pending; no unlimited-free claim |
| DEP-001-003, DEP-013-014 | Environment examples and optional cloud setup; existing native/local Compose retained; production Compose added |
| DEP-004-006 | TLS/same-origin topology and controlled migration/non-owner runtime instructions prepared; live deployment and runtime-role verification pending |
| DEP-007-008 | Existing full CI/migration/contracts retained; new lifecycle tests; existing live/ready endpoints documented; full new run not executed |
| DEP-009-012 | Snapshot/checksum backup and isolated restore tooling; limits/cold starts/outage behavior documented; rehearsal and staging gate pending |
| CHG-SONG-001-002 | Authentication/shared reading/private ownership preserved in source; operator-only cloud writes; actual hosted two-account gate pending |
| CHG-SONG-003-004 | Folder/audio/text variants retained; provider original-text round trip exact; supplied source round trip blocked by rights |
| CHG-SONG-005 | Listening-room UI untouched; storage route URLs unchanged; actual remote player regression pending |
| CHG-SONG-006 | Stable UUID/revision, optimistic cutover, explicit rename/rollback code and lifecycle tests; database demonstration pending |
| CHG-SONG-007 | Local/object adapters and protected ranges implemented; real provider 206 verified; full protected remote API gate pending |
| CHG-SONG-008-009 | Idempotent durable journal, bounded copy/checksum verification, explicit cleanup and old mapping retention; collection migration pending |
| CHG-SONG-010 | Truthful rights gate, private bucket, scoped secrets and Free project verified; distribution permission remains missing |
| CHG-SONG-011 | Matched active-object/DB backup/restore code; all-user data included with original ownership; full restore/deletion demonstration pending |
| CHG-SONG-012 | Operator/recovery guide and explicit release limitations delivered |

No new database migration is necessary: migration 0013 already supports object
bindings and existing song_imports holds journal/provenance/import state. The
outgoing change manifest and scoped patch are retained under `.artifacts`.

## Failures and remaining work

All 24 supplied recordings/texts remain **unverified for online distribution**.
The old importer assertion was not accepted as permission. No licenses, artists,
timestamps, transpositions or replacement songs were invented. Only original
test text was uploaded; originals remain on disk. The owner can keep using the
accepted local preview; Phase 19 has not replaced its running services.

Required release actions: establish actual rights or supply original/licensed
content; connect an existing zero-cost host and working mail credentials;
provision a non-owner runtime DB role; run controlled migrations and full tests;
take/rehearse matched backup; sync approved files and verify clean-environment
playback/auth/isolation/rollback. Free hosting can sleep or suspend. Render Free
blocks common SMTP ports, so it cannot be assumed compatible with current mail.
No paid workaround was selected. See CLOUD-SONG-OPERATIONS.md.

## Git status

Local Git branch creation was denied by workspace permissions; the managed
worktree request also failed. Existing local repository state was preserved.
The connected GitHub repository was verified private; a remote `codex/phase-19`
branch was created from the accepted base. The remote branch is the review destination; the final handover records the resulting commit/PR.
The commit uses [skip ci] to avoid triggering potentially billable hosted compute
until the account's included Actions allowance and zero-spend setting can be verified.
Existing quality gates remain required and were not weakened. No force push, merge, visibility change, media or credential push
is authorized/performed. Hosted CI is not a pass claim; paid CI is not enabled.

Next prompt: `docs/implementation/phase-prompts/PHASE-20.md`, after the remaining
Phase 19 release gates close. Phase 20 was not executed.


### Actual Git handover - 13 November 2026

Implementation committed and remote branch advanced to `cab003b68d74579adbb5d4932c1eaaf0d446e6d3`.
Draft PR: https://github.com/rayyanhasan899/Chord-House/pull/20
Base: `codex/phase-18-reconciled`; head: `codex/phase-19`.
Only the 30 reviewed phase-owned files were committed through the connected private repository API.
The local source copy is not a registered worktree and root remains unchanged apart from this new report.
No merge, force push, paid Actions run or supplied-media publication occurred.
A following documentation-only commit records this handover; application code remains at cab003b.
