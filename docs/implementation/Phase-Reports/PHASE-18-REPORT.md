# Phase 18 report — Quality, compatibility and performance

Dates: 2026-11-11–12, Asia/Karachi. Phase 18 only; Phase 19 has not started.

## Outcome

Implemented: complete cross-engine qualification tooling, demanding generated
audio fixtures and timing measurements, disposable catalog profiling, lighter
rights-aware listings, bounded/retryable audio startup, tuner interruption and
rapid-restart cleanup, chord hydration/start/cancellation fixes and keyboard
access to the daily progress table. Original unfinished song/player changes and
personal data remain outside the isolated Phase 18 checkout.

**Implementation delivered; Phase 18 exit gate is NOT met.** The final full
run completed with **80/86 browser journeys passed, 6 failed, 0 skipped**.
Chromium 24/24 and mobile Chromium emulation 7/7 pass; Firefox 23/24, WebKit
20/24 and mobile WebKit emulation 6/7 remain incomplete. These failures are
recorded below and are not represented as a passed phase or a ready-to-merge PR.

Prerequisites inspected: phase prompt; source Requirements/Architecture Blueprint;
requirements analysis, architecture/database, assumptions, traceability, roadmap
and relevant Phase 08/10/12–17 reports; frontend AGENTS/installed Next 16.4.5
production/error guides; Git branch/worktrees/status/private remote and runtime.
Phase 17 is complete at 35b5d86 with passing implementation bbde6aa and run
42995354280. Checklist: preserve work; map all 42 rows; measure and repair;
execute full negative/database/browser/audio gates; document/review/commit/push/PR;
stop before Phase 19.

### Executed verification

| Check | Observed result |
| --- | --- |
| Locked npm ci | Passed; existing development-only advisory remains disclosed |
| npm run format:check / lint / typecheck | Passed locally and in hosted frontend checks; final exact-run linkage below |
| npm test | **465 passed, 11 files**, local final-review run; earlier 464 passed before the added chord cancellation regression |
| npm run build | Default production Turbopack passes on Linux; native Windows helper failure is recorded below |
| npm --workspace frontend run build -- --webpack | Passed locally; final preview rebuild documented below |
| npm run contracts:check | Actual FastAPI/OpenAPI/client drift check passes in hosted backend checks |
| Ruff check / Ruff format --check | Passed; **110 files** formatted |
| python -m mypy app | **75 source files** pass in hosted backend checks |
| python -m pytest | **97 cases** pass against real disposable PostgreSQL, including fresh upgrade/downgrade/drift and new differential listing tests |
| python tests/profile_quality.py | Real authenticated FastAPI/SQL profile of **5,000 disposable records** passes its 5-second budget; measurements below |
| Full production browser_system.py | Chromium/Firefox/WebKit full journeys plus mobile Chromium/WebKit emulation; **80 passed / 6 failed / 0 skipped in 14m52s; gate not met** |
| Native installed Chrome quality | **6/6 passed**, version **157.0.8103.40**, real generated analyser/worker pipeline and fallback/navigation checks |
| Native installed Edge quality | **6/6 passed** on a separate successful attempt, version **157.0.4341.42** |
| npm run security:audit / isolated pip-audit | Runtime npm **0** and 47 pinned Python packages **0 observed findings**; nine moderate dev entries from one advisory remain under the existing exception expiring 2026-12-11 |

Commands use Node 24, Python 3.14 and committed locks. Native Windows tests use
process-only D: TEMP/TMP. CI backend uses official matching Playwright 1.65.0 Noble
and Ubuntu 24.04 with a correctly owned container home and PulseAudio null output;
the virtual output is not a physical speaker. All temporary DBs are explicitly
disposable. No personal database, mail, export or credentials are uploaded.

### Measured results and practical limits

The exact deterministic noisy-pluck replay covers **80** combinations: ten pitches
including bass E1 and guitar E2/A2, 32/44.1/48/96 kHz, post-attack and decayed
windows, strong second/third harmonics, seeded noise and DC offset. Maximum
absolute error is **3.0030602 cents**, below the controlled ±5-cent threshold.
Existing preset/silence/weak/noise tests remain. Explicit 81.3/81.8/82.406889 and
109.2/109.8/110 Hz fixtures test the earlier approximate report without inventing
physical calibration or changing the detector reference.

Thirty-minute deterministic jitter simulations produced **901/3,601/9,001 ticks**
at 30/120/300 BPM. Maximum phase errors were **0/0/2.724e-10 seconds**. The
lookahead includes the next tick just beyond the observation window. Existing
three-minute native browser scheduling checks include an 80 ms UI stall;
final per-engine results are recorded below. Scheduled timestamps do not measure
speaker latency or acoustic jitter.

Successful native Chrome capture displayed **41.20 Hz / -0.145 cents** and
**82.56 Hz / +3.214 cents** for synthesized 41.2034446/82.406889 Hz targets;
maximum observed worker round trip **5.3 ms**. Successful Edge displayed
**41.21/82.42 Hz**, both approximately **+0.275 cents**, maximum worker round
trip **5.9 ms**. These rounded display comparisons, stopped tracks/closed contexts,
secure localhost and zero audio POSTs are observed generated-stream results,
not measurements of the owner's microphone or guitar.

On that Chrome production build, initial document DOM-ready was **91.7 ms**;
Home/Tuner/Metronome/Chords became ready in **225/204/72/81 ms**, with cumulative
script transfer at most **173,101 bytes**, no downloaded audio assets and no
horizontal overflow. Edge's separate successful run measured **34.8 ms** initial
document DOM-ready and **191/113/63/65 ms** route readiness. Soft-navigation route
timings are distinct from initial-document DOM readiness. This is local,
unthrottled production-build evidence, not mobile-network/field-vitals or capacity
certification. Sample maxima are not called population p95.

Hosted profile run 43050354359 measured authenticated 5,000-record substring
search warm median **660.9 ms**, maximum **786.5 ms**; Urdu filtering **187.6 ms**
median, exact-title match **6.63 ms**, offset 4,980 **657.0 ms**, lyrics-availability
filter **663.7 ms**. Each category includes one first request plus five warm
samples and bounded 20-item responses. The SQL plan is preserved in the artifact.
These are in-process FastAPI/auth/SQL measurements, excluding public network
latency. Existing status/language indexes remain; substring scans still scale
with matching candidates. No unsupported speedup ratio is inferred from the
earlier overloaded local run that exceeded five seconds.

## Changes and traceability

Catalog listing DTOs project metadata and component grants instead of validating
and copying every full lyric/score for every match. Full write/detail validation,
live grant/expiry/withdrawal checks, filtering, total counts, pagination and
private/no-store remain. Differential tests compare listings with full details
after rights changes. No schema migration, new content, result cache or database
extension; head remains **0012_integration**.

Audio startup has a five-second bound and device/retry guidance. The tuner
unlocks audio in the Start gesture, waits for actual context closure before
allowing restart, releases capture on interruption and ignores stale worker/track
callbacks. Chord playback waits for hydration, exposes startup/cancel states and
protects newer playback from an older rejected start. SVG titles use one stable
string, eliminating observed hydration errors. Loading chord lists no longer
also announce an empty result. The progress table is explicitly keyboard focusable.

| SRS scope | Evidence / residual condition |
| --- | --- |
| NFR-PER-001–007 | Production navigation/transfer, off-thread capture, live-rights 5,000-record search/plan, streamed pages and private/no-store; broad engineering budgets in ADR-0024 |
| NFR-REL-001/002/005/006 | API/audio/permission failures, bounded startup, explicit recovery, failed task save retains its draft and retry persists one item; no private browser draft persistence |
| NFR-REL-003 | Conditional provider backup configuration/restore gate explicitly remains Phase 19; no hosted provider selected or backup claimed configured |
| NFR-REL-004 | Disposable fresh upgrade, drift and downgrade/upgrade tests; no new migration |
| NFR-COMP-001–005 | Three-engine journeys, installed Windows Chrome/Edge, mobile emulation, missing APIs, secure localhost and cleanup; actual Safari/mobile/output gaps remain explicit |
| TST-001–010 | Complete pure/domain/repository/API/component/music/diagram/negative/keyboard/responsive suite; existing assertions retained |
| TST-011–017 | Real registration/login/logout/profile/workspace/favorites/practice/search/learning journeys across engines; test reports are scoped to each browser's own fixture |
| TST-018–021 | All presets, known frequencies, bass, harmonics, decays, silence/weak/noise/DC and native generated capture |
| TST-022–024 | Thirty-minute simulation, three-minute native schedules, chord/pattern controls and interruption/navigation/cancellation cleanup; physical outputs remain unverified |

All **42 assigned rows** are updated; no scoped MAY rows exist. A-039–041 and
**ADR-0024** record engineering budgets, device evidence, virtual-audio/runtime
choices and preview continuity. Requirements, architecture/database, plan,
traceability, README and installation/quality documentation are updated. Source
SRS/blueprint/master prompt are preserved. Quality code is tooling and focused
feature fixes, not a manufactured production domain service.

## Failures, remediation and remaining work

- Initial Windows restricted-temp tests could not rename their cache; D: process
  TEMP/TMP resolved it. CRLF checkout conversion caused format failures despite
  unchanged source; `.gitattributes` now standardizes LF in this checkout.
- Native Turbopack's CSS helper exited before connection, including an ordinary
  process-access retry. The supported Webpack production builder passes; Linux
  still checks the default builder. No OS policy or driver was weakened.
- Two local disposable full-suite attempts each had one transient auth/session
  failure. Sanitized diagnostics did not establish its cause; selected 13 tests
  and then all 96 baseline tests passed, with repeated independent hosted 97-case
  passes. No auth check was weakened or artificial session tolerance introduced.
- Early hosted font/browser installation failed Ubuntu DNS. The matching official
  browser image removed that dependency. Runner/container OS alignment fixed a
  Python SSL mismatch; container-home ownership fixed Firefox launching. Parallel
  memory pressure produced a browser crash, so native-clock CI runs serially.
- First expanded run had 53/86 browser passes; the next had 72/86. They are not
  counted as passed gates. They exposed hydration, keyboard, rapid restart and
  unavailable audio-backend issues plus a shared moderation-report fixture and
  Firefox client-redirect test race. Fixes retain substantive assertions.
- Ubuntu/Azure/archive DNS and a later kernel-mirror TCP timeout blocked package
  setup. Signed mirror installation succeeded once; its explicit PULSE_SERVER
  prevented daemon autostart, corrected by starting without that client selector.
  Current setup uses bounded signed-mirror fallback and leaves Ubuntu package
  signature verification enabled. Final setup/run outcome belongs below.
- Native Edge/Chrome cold-start or GPU/resource stalls occurred in early combined
  attempts. The successful separate six-case runs are identified above; the
  combined attempt with a failed Edge case is not claimed as a 12/12 pass.

The owner offered the current computer and Google Chrome, then asked the agent
to perform the checks itself. The agent cannot physically pluck the guitar or
read GuitarTuna, so exact real E2/A2/other-string comparison remains **unverified**.
Physical microphones, speakers/headphones, actual iOS/Android, branded Safari,
background/sleep continuity and live assistive-reader certification remain device
gaps. No arbitrary detector correction or hardware success claim was added.
Provider backups/TLS/proxy/restore are Phase 19 gates. Popular-song coverage
remains **85 metadata identities plus six original practice songs**; performance
fixtures are not an expanded licensed learning catalog. Existing development
dependency exception and content-rights limitations remain disclosed.

### Local environment and activation

C: was nearly full (as low as approximately 60 MB), with about 0.7–0.9 GB physical
RAM free on this 8 GB workstation during failures. Rebuildable npm `_npx`
(approximately 729 MB) and automated Playwright cache (approximately 776 MB)
were preserved on D: under ignored `.artifacts/host-cache`, with junctions at
their old C: locations. Keep those targets while links exist. No personal browser
profile, project data, env/mail or volume was removed; subsequent temporary files
use D:. Drive space remains a material operating limit, not a resolved capacity
guarantee.

Docker became unresponsive. Using the owner's earlier explicit restart approval,
normal restart was attempted and timed out; only verified Docker processes and
the `docker-desktop` WSL engine were restarted. Ubuntu was not stopped. Original
Chord House and Devtreck running containers recovered; previously stopped
unrelated services were left stopped. Disposable test containers/networks were
not retained. Original API readiness and restored preview readiness returned 200.
One automatic approval timed out before a commit; its narrow retry completed.
No unresolved permission rejection is being represented as a successful action.

Phase 18 uses the existing isolated `chord-house-preview` project, generated
credential, DB/mail volumes and accounts at **http://127.0.0.3:3002** (API 8002,
DB 5435). The preview API was rebuilt from Phase 18 and verified healthy. The
Windows production frontend uses the verified alternative builder. Final local
activation/rendering evidence is recorded below. Original personal data and
unfinished local-song/player code are neither copied nor certified.

## Git and handover

Isolated branch **codex/phase-18**, base **35b5d86** on completed codex/phase-17;
worktree `D:/RAYYAN/Projects/Chord-House/.artifacts/phase18-worktree`.
[PR 18](https://github.com/rayyanhasan899/Chord-House/pull/18) targets codex/phase-17
in the existing **private** repository and remains unmerged. Final tested code,
run links and documentation-only commit are recorded after verification. No
force push, visibility change, merge or Phase 19 work.

Original checkout stays on codex/phase-15 with its backend catalog/workspace,
frontend song/player/style/contracts/test edits and untracked source documents/
songs intact. Only phase-owned worktree files are committed. A final report copy
is supplied in the original Phase-Reports directory without overwriting user edits.

What you can use: guest tuner/chord library/metronome; signed-in songs, private
workspace/customs/favorites, practice/routines/goals/progress and training/reminders;
account export/confirmed deletion. Phase 18 improves rendering, recovery, cleanup,
keyboard access and measured catalog behavior. Use the isolated preview for this
version. Physical calibration and unavailable licensed popular content are not
presented as working functionality.

Next prompt: `docs/implementation/phase-prompts/PHASE-19.md`, only on owner request.

Final tested application: **d4145cef19fc5c6a7074e8916c751235c4e44234**. Push run **43149225388** and PR run **43149230889** both completed with frontend/security success and backend failure at the browser stage. All pre-browser backend stages passed. Subsequent documentation-only commits do not change application behavior.

## Final unresolved browser gate — 2026-11-12

The full native-clock run executed; signed mirror/PulseAudio setup succeeded.
Exact remaining failures on d4145ce:

1. WebKit three-minute metronome: ordinal phase-error assertion received 0.5 seconds rather than less than 0.001. Determine whether the designed missed-beat recovery or real drift caused the gap; do not silently relax the test.
2. WebKit synchronized-pattern/direction journey: expected nine scheduled voices, received eight (the final muted stroke needs investigation).
3. WebKit noisy harmonic generated capture: second guitar capture reported microphone permission denied instead of in-tune; distinguish the controlled MediaStream fixture lifecycle from actual microphone support.
4. Mobile WebKit emulation: the same generated-capture failure.
5. Firefox account export/deletion: browser page crashed before filling the export password. Backend isolation/export/cascade checks and Chromium account journey pass, but this Firefox UI path is not certified.
6. WebKit baseline tuner: second start did not reach in-tune after stopping the first capture.

These are unresolved verification/runtime issues, not blanket physical-device
successes or accepted requirement deferrals. No assertion was removed, failed
case skipped or result fabricated. Phase 19 has not started. Further focused
Firefox/WebKit diagnosis and successful regression verification are required
before marking Phase 18 complete. The owner requested a prompt handover after
the prolonged run; this report preserves the concrete implementation and exact
remaining work instead of claiming a green gate.

Final evidence: `.artifacts/evidence-d4145ce/frontend/test-results/results.json`,
its error contexts, `.artifacts/final-run-failures.log` and the uploaded
`phase18-quality-evidence` artifact in run 43149225388. Native Chrome/Edge six-case
successful attempts and final loaded-chord/start-cancellation check are separate
local evidence, with no physical microphone access. The preview remains usable
at http://127.0.0.3:3002 with the verified Chrome path. Original changes/data are
preserved. PR 18 is a draft, unmerged; no readiness or full-compatibility claim.
