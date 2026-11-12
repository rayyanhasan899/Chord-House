# Quality and compatibility

Phase 18 evidence is in `../implementation/Phase-Reports/PHASE-18-REPORT.md`.
An automated check is not a guarantee for every device. ADR-0024 separates
generated audio, browser-engine testing, installed stable browsers and physical
instrument/output checks.

## Repeatable checks

Use Node 24/npm 11, Python 3.14 and the committed dependency locks. Run `npm ci`,
`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`, `npm run contracts:check` and `npm run security:audit`.
From backend run Ruff check/format, `python -m mypy app` and `python -m pytest`.
The contracts command imports the real FastAPI application; a handwritten schema
is not a replacement. Dependency scans retain the prior explicit expiring
development-only exception, not a clean full audit claim.

Database tests and `python tests/profile_quality.py` require the explicitly named
`CHORD_TEST_DATABASE_URL`, pointing only at a disposable migrated database.
The profile adds 5,000 unique copies of project-authored exercises, measures
authenticated search and pagination with live rights checks, records the SQL
plan and removes those fixture identities/account in `finally`. It never defaults
to `CHORD_DATABASE_URL`. These records are test load, not catalog coverage.
The profile JSON contains timings, query categories and the synthetic plan, not
credentials or real private records. Do not run these commands on personal data.

`python tests/browser_system.py` starts a real test API, a production frontend
and isolated mail capture. It runs all baseline journeys in Chromium/Firefox/
WebKit and focused mobile-emulation checks. Native Linux clocks use a PulseAudio null sink and serial execution; these are virtual output measurements, not speaker listening results. The CI image must match the locked
Playwright version. Windows installed-channel checks additionally set
`CHORD_BRANDED_BROWSERS=1` and select `--project=chrome-stable` and/or
`--project=edge-stable`; install neither browser automatically on a personal
machine. Guest-only checks may exclude `failed save`, but this does not replace
the full disposable-database authenticated journey.

Windows temporary files can be directed to an ignored workspace folder using
process-only `TEMP`/`TMP`. The observed native Turbopack CSS-helper startup failure
can be worked around with `npm --workspace frontend run build -- --webpack`;
Linux CI still checks the default production builder. Do not disable OS policy
or change the locked drivers to make local checks appear green.

## What is measured

- Pure tuner fixtures cover standard/alternate guitar, low bass and ukulele;
  harmonic-rich decays, deterministic noise/DC offset and 32/44.1/48/96 kHz input.
  ±5 cents is the controlled-signal threshold. Earlier 81.x/109.x reports are
  represented as exact generated inputs without assuming the guitar was in tune.
- Browser capture tests feed synthesized noisy low-bass/guitar streams into the
  real analyser/worker. They check cents, worker round-trip timing, no audio POST,
  secure localhost context and stopped tracks/closed contexts after interruption.
- Existing three-minute native metronome scheduling runs include an 80 ms UI
  stall; new deterministic simulations cover 30 minutes at 30/120/300 BPM.
  Audio-clock scheduled times do not measure acoustic click latency or jitter.
- Production navigation measurements record DOM-ready, script transfer, overflow
  and absence of eagerly downloaded audio assets on core guest routes. They are
  local CI measurements without CPU/mobile-network throttling, not field vitals.
- Failed task writes must retain the typed draft, show an error and persist one
  item after a successful retry. Existing negative API, ownership, migrations,
  expiry, account lifecycle and private-state cases remain in the complete suite.

Raw evidence is attached to the quality artifact and JSON browser report. Broad
regression budgets in ADR-0024 accompany raw values; small sample maxima are not
represented as population p95. Song responses stay `private, no-store`. No song
result cache or browser draft persistence containing private notes is introduced.

## Device acceptance procedure and remaining gaps

On the actual computer/phone in a quiet room, use a trusted reference at A4=440 Hz.
Choose instrument/tuning/target, tune the real string, then note exact reference
cents and Chord House Hz/cents after 0.5 and 2 seconds, repeated three times.
Record browser/version, OS, microphone/input route, note, clipping/room noise and
any drop, instability or octave jump. Compare E2/A2 specifically with the earlier
qualitative GuitarTuna report. Do not infer calibration from approximate values.
The agent cannot physically perform this step; owner-supplied measurements are
not replaced by generated audio.

Repeat listening/playback on built-in speakers and headphones at comfortable
volume; check simultaneous chord, arpeggio, pattern and metronome behavior, pause/
resume, Stop, navigation, device disconnect and microphone-indicator release.
Background tab/sleep continuity is not guaranteed. Actual mobile Safari/Chrome,
macOS Safari, physical bass microphones, output routes and assistive readers need
separate observations. Record unavailable cases as unverified rather than passed.

Provider backups, hosted TLS/proxy and restore/rollback rehearsal are conditional
deployment gates in Phase 19; no provider is selected/configured by this phase.

Audio startup has a five-second bound with device/retry guidance. Stop waits for tuner context release before enabling Start; stale track/worker callbacks are ignored. Chord play waits for hydration, SVG titles use one stable string and the daily progress table is keyboard focusable.

Operational refinement (2026-11-12): signed Ubuntu package acquisition uses bounded fallbacks across the official archive, Kernel Archives and MIT mirrors after DNS/TCP failures. Ubuntu signature and TLS checks remain enabled. Start the PulseAudio daemon without the client PULSE_SERVER selector, then connect clients to its private Unix socket. Chord startup can be cancelled with Stop; stale rejected starts cannot close newer playback or overwrite its feedback.
