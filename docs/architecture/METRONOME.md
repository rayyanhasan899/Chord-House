# Metronome

Guest route `/metronome` needs no account, microphone, backend endpoint or paid service. Press Start to activate browser audio; Stop or navigation closes the context. Tempo is 30–300 integer BPM, with number/slider and up to seven recent taps. Meter choices are 2/4, 3/4, 4/4 and 6/8; BPM counts denominator-note clicks (eighths for 6/8). Meter changes stop/reset playback. Accent, click style, volume and visual display are optional.

`features/metronome/timeline.ts` is framework-independent beat/tap math. `engine.ts` owns browser audio and lifecycle; `metronome.tsx` owns controls and feedback. Every 25 ms the engine schedules oscillators up to 150 ms ahead against AudioContext.currentTime; requestAnimationFrame consumes scheduled beat times for visuals. UI rendering does not drive click timing. Settings changes can take up to the existing 150 ms scheduling window to reach queued clicks. Stop closes the context, cancelling queued sound, intervals and animation frames; generation guards prevent late starts after cancellation.

Brief UI stalls are covered by lookahead, but background throttling, device sleep and long main-thread stalls are not guaranteed. Late beats are skipped rather than emitted in a burst. A suspended/interrupted context is closed with restart guidance. Restart begins a fresh measure. Audio errors and unsupported Web Audio produce actionable feedback. No audio or personal data is transmitted or persisted.

Tests distinguish simulated five-minute timeline checks, real three-minute Chromium scheduling and physical sound. Browser instrumentation checks native oscillator scheduling times, not speaker latency, device clock accuracy or perceptual quality. Manual listening on intended hardware remains useful; uninterrupted background playback is not promised.

Scheduling reference: [MDN advanced Web Audio techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques); context lifecycle: [Web Audio specification](https://www.w3.org/TR/webaudio/).
