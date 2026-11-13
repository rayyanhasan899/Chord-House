# Final requirements analysis — 2026-11-08

Phase 16 implementation: assigned UNI-006–015 and NTF-001–007 behavior is implemented under ADR-0022. Selected MAYs: UNI-005 deterministic suggestions (revisited after 13), UNI-010 random sequences, UNI-021 self-reported challenge, UNI-022 note finder, UNI-023 approved-text section cues and NTF-004 browser notifications. Recorded-song/melody playback and time stretching remain unselected without verified recording rights. Catalog coverage remains 85 popular metadata entries plus six original exercises; no new rights or song count are claimed.

Reminders default off, use current profile timezone/weekdays, a ten-minute due window and once-per-local-date claims. An open visible signed-in tab is required. Denied/unsupported notification permission retains in-app delivery and usable tools. The owner delivery question is unanswered: this is stated engineering assumption A-013, not owner approval. Assessments never count toward goals/streaks; explicit saved Practice sessions do. See the Phase 16 report for exact executed evidence and remaining content/hardware limits.

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


Phase 14: PRA-011–018 and UNI-016–020 implemented through derived practice summaries, goals/history/charts/rankings, and private self-reported roadmap. UNI-025 weekly review MAY selected with derived time/goal results and private improvement notes. Calendar A-009/A-010 explicitly accepted by owner reply. ADR-0020 and ../architecture/PROGRESS.md describe calculation rules and limits; PHASE-14-REPORT.md records executed evidence.


Phase 15 implements ADM-001–012 through protected shared catalogue management, rights-gated publication/import/withdrawal, private reporting/correction and redacted audits. All scoped SHOULD behaviors selected; no scoped MAY rows. Source acquisition and professional content/translation/audio review remain separate gates; adding administration does not close the popular-song coverage gap. See PHASE-15-REPORT.md and ADR-0021.


## Phase 17 implementation

ACC-024/025/027/028, NFR-SEC-001–014, NFR-PRI-001–008 and NFR-UX-001–009 are implemented/reviewed under ADR-0023 and SECURITY-AND-PRIVACY.md. Own-data export uses password/CSRF/explicit confirmation without a new verified-email gate; deletion retains verified email and explicit destructive confirmation. All owner-linked stores and shared actor anonymization are covered. Periodic expired-code/session/mail cleanup is implemented. Production transport/cookies/limited roles, response privacy, request bounds and cross-tab private-state clearing are hardened. No new scoped MAY exists. Actual public TLS, operator/provider/backup configuration, live assistive-reader and earlier instrument hardware checks remain distinguished from tested software. One known development-only dependency advisory graph has an expiring documented exception; runtime/Python scans have no observed findings. Original uncommitted local song/player code is preserved outside this reviewed branch.

## Phase 18 quality qualification

Execute all 42 assigned PER/REL/COMP/TST rows with exact measured evidence and explicit device gaps (ADR-0024). Existing unit/domain/ownership/API/migration/contract coverage is retained; complete journeys run in three engines, focused mobile emulation and installed-browser checks are distinguished from physical hardware. Profile a disposable 5,000-record catalog with live content rights and no private caching; test failed-save draft recovery, generated noisy/low-bass signals, 30-minute simulation and native scheduling/cleanup. REL-003 is conditional on the Phase 19 hosting/backup choice; physical output/microphone/Safari/mobile observations remain separate. Catalog content coverage/rights do not increase through test fixtures. Original uncommitted song work is outside this branch's verification. Exact results and residual limitations belong in PHASE-18-REPORT.md.


## 12 November 2026 — accepted song library amendment

Accepted: open registration; all signed-in users share the ready-to-play library; guests cannot read/play songs. Operators manage shared assets; user-specific information stays private. Preserve current audio player and exact English/Urdu/Hindi/Roman lyrics, with language/title folders containing audio.mp3 and/or lyrics.txt. Existing minimal folders remain sufficient. Substantial expandable coverage remains a product priority; possession does not prove distribution rights. The added twelve CHG-SONG requirements supplement the original 450. Planning is not implementation evidence.

Details: [accepted baseline and added requirement IDs](OWNER-SONG-LIBRARY-BASELINE.md), [storage and migration plan](SONG-LIBRARY-STORAGE-PLAN.md), and revised [Phase 18](phase-prompts/PHASE-18.md), [Phase 19](phase-prompts/PHASE-19.md), [Phase 20](phase-prompts/PHASE-20.md). These dated decisions supersede conflicting earlier proposals only for their stated scope.


## Phase 19 execution update - 13 November 2026

Private Neon Free storage has been provisioned and the cloud adapter, operator
copy/verification/cutover/recovery tooling and production manifests prepared.
The release gate remains open: distribution rights, hosting/mail configuration,
full regression and matched restore are not verified. Preserve the accepted
reconciled Phase 18 app; do not replace it with the stale root checkout.
See [Phase 19 report](Phase-Reports/PHASE-19-REPORT.md),
[provider decision](../adr/ADR-0026.md) and
[operator guide](../architecture/CLOUD-SONG-OPERATIONS.md) for exact evidence.
