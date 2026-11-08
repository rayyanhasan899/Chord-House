# Phase 08 report

Implemented: guest browser-local instrument tuner, supported tuning presets, explicit start/stop permission flow, local worker pitch estimation, frequency/note/cents, target/needle/status, confidence suppression, input-level feedback, smoothing, denial/disconnection handling and cleanup. Algorithm and limitations in docs/architecture/TUNER.md.

Tested: 63 Vitest/component tests passed including all supported pitches at 44.1/48 kHz, strong harmonics, low bass E1, silence, weak input and deterministic noise; generated fixture errors stay within five cents. Frontend lint/types/build and contract consistency pass. Full PostgreSQL/API/browser runner verifies prior workspace/auth behavior; native generated audio pipeline, no audio POST traffic, stop/unmount and permission denial tests added. Exact final results/CI recorded after run.

Not verified: real-device/reference-tuner calibration and real-instrument microphone accuracy (TUN-049/051). This is an OPEN acceptance gate, not completed testing. User hardware question remains pending. No claims of measured real-world accuracy. No microphone permission requested on the user's device by automation; tests use synthetic MediaStream only. No raw audio stored or transmitted outside the browser worker.

Phase 07 local and GitHub checks passed (runs 42467487929/42467482979). Current Phase 08 branch codex/phase-08; no merge. Report Git commit/push/PR status from actual commands. User sources and existing generated type-path change preserved.

Usable: /tuner without an account; choose instrument/tuning/target, Start and grant permission, pluck one string, Stop to release microphone. /dashboard remains usable for private workspace. Song content needs reviewed catalogue data; no invented library. Next phase prompt is PHASE-09.md, but full Phase 08 verification must retain the physical-calibration gate until measured.

Final local system run: 16 PostgreSQL tests and 5 production browser tests passed without skips; tuner screenshot visually inspected. User confirmed guitar/reference tuner availability; six-string comparison readings requested and pending. Hardware gate remains open until results are received.

Hosted verification: implementation c0ac5ee, PR https://github.com/rayyanhasan899/Chord-House/pull/8 . GitHub run https://github.com/rayyanhasan899/Chord-House/actions/runs/42468000916 passed both backend and frontend jobs, including full browser pipeline. No merge. The local workspace/tuner/proxied DB readiness each returned 200 after migration/restart. User has a guitar/reference tuner; actual six-string readings remain pending, so physical calibration is still open.

## Initial guitar feedback — 2026-11-08

Owner reports D3/G3/B3/E4 correct and E2/A2 reading approximately 81.x/109.x Hz. Exact Hz/cents, reference readings/calibration, browser and microphone not yet supplied. This is qualitative feedback, not a passed accuracy measurement. Expected nominal E2 is 82.406889 Hz and A2 is 110 Hz.

Additional direct Node execution of detect(): 54 synthetic cases across E2/A2 at 44.1/48/96 kHz, three phases and three exponential decay rates, stronger second harmonic plus third harmonic and deterministic low noise. No cases rejected; observed error range +0.002 to +0.104 cents. This does not reproduce a systematic negative low-frequency bias. No detector offset or tuning reference changed. Physical comparison remains open; exact simultaneous reference/application readings requested.
