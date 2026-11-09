# Final requirements analysis — 2026-11-08

User decisions supplement the unchanged source SRS and blueprint. Original documents remain preserved.

1. Core song catalogue includes popular English, Urdu and Hindi songs, with Roman Urdu/Hindi variants. English UI is independent of song language. No fixed small sample-only cap.
2. Guests can use tuner, metronome and public chord library. Personal records require authentication; song discovery/learning requires sign-in (owner confirmation in Phase 12). Other guest catalogue access is not inferred.
3. Secure server-managed cookie sessions; revocation, expiration, logout and backend authorization required.
4. Fully usable local application plus deployment preparation; no paid core dependency; provider selection requires current evaluation.
5. Guitar presets: E2 A2 D3 G3 B3 E4; Drop D D2 A2 D3 G3 B3 E4; DADGAD D2 A2 D3 G3 A3 D4. Preserve bass E1 A1 D2 G2 and re-entrant ukulele G4 C4 E4 A4.
6. Custom chords and patterns are private; public sharing excluded initially.
7. Saved sessions drive minutes, daily/weekly goals, history and consecutive-day streaks in user timezone; edits/deletions must recompute.
8. English default UI, future translation seams; multilingual song data now.

Copyright clarification: the request to assume popular lyrics are freely reproducible cannot establish permission. SON-021–028 and SRS §1.2/2.2 require verified rights. Full lyrics, including Roman transliterations, are a desired capability gated by explicit rights, territory and provider terms. Missing rights must never be reported as acquired. Metadata and authorized links remain useful, and chord arrangements require their own provenance. No comprehensive free popular-song lyrics source has been verified. Source and coverage acquisition are release risks, not solved engineering tasks.

All MUST and SHOULD requirements are planned; MAY items remain visible in traceability and require explicit selection/evidence or a documented deferral. SRS §15 has six broad delivery groups; master prompt expands these into 20 phases without removing scope. SRS §17 refers to its own phase groups, not only implementation phases 01/02. Release also requires legal content review, isolation and measured tuner evidence.

Remaining gates: permission/provenance for desired popular content; actual catalogue breadth acceptance (no numeric target approved); final deployment accounts/providers/region; email delivery provider for verification/reset; physical-device tuner checks. These do not block planning. No guarantee of comprehensive full lyrics at zero cost is made.


## Phase 13 implementation reconciliation

Practice session lifecycle/history/corrections, optional learning links, reliable timers, private reusable ordered routines and guided tools are implemented under PRA-001–010/019–022 and UNI-001–004. Daily/weekly goal settings (PRA-011/018 portion) are included as explicitly scoped; goal completion/aggregation/streaks are Phase 14. PRA-021 MAY is selected. UNI-005 MAY deterministic recommendations are explicitly not selected now, reconsidered in Phase 16. No popular-song rights or new public sharing permission is inferred. ADR-0019 and ../architecture/PRACTICE.md define timing, retry, ownership and retention. Phase 13 report holds executed verification; proposed calendar decisions remain open for Phase 14.
