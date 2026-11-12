# Assumptions and decisions

Phase 05 update: A-011 is adopted as initial engineering policy (24h idle/7d absolute sessions). A-025: private local mail capture plus SMTP adapter, with real delivery required in production. A-026: verified email/current password/confirmation guard account deletion; existing private data cascades. OAuth remains unselected and full export remains a Phase 17 contract. No new user product approval is inferred.

Accepted records reflect user decisions only. Proposed policies are reversible engineering recommendations, not approvals. Preserve history and mark superseded with a replacement ID.

| ID | Status | Topic | Decision/proposal | Reason | Impact / next decision | Confidence |
|---|---|---|---|---|---|---|
| A-001 | Accepted | Content breadth | English/Urdu/Hindi popular-song catalogue and Roman variants | Explicit user decision | Rights availability remains a gate | High |
| A-002 | Accepted | Guest tools | Tuner, metronome, public chords accessible without account | Explicit user decision | Other guest catalogue access undecided | High |
| A-003 | Accepted | Sessions | Server-managed secure cookie sessions | Explicit user decision | Session constants proposed separately | High |
| A-004 | Accepted | Deployment | Local complete plus free hosting preparation | Explicit user decision | Provider/region selected in 19 | High |
| A-005 | Accepted | Tunings | Standard, Drop D, DADGAD guitar plus standard bass/ukulele | Explicit user decision and SRS | Additional presets future | High |
| A-006 | Accepted | Sharing | Private custom chords and patterns only | Explicit user decision | No sharing initially | High |
| A-007 | Accepted | Progress | Saved practice contributes; timezone-aware recalculation | Explicit user decision | Boundary defaults below | High |
| A-008 | Accepted | Language | English UI and multilingual song catalogue | Explicit user decision | No UI translation implementation initially | High |
| A-009 | Accepted (Phase 14 owner reply) | Calendar rules | Monday week start; positive saved active duration qualifies a practice day; split intervals at midnight | Deterministic testable default | Implemented in Phase 14; preserve exact seconds and show rounded minutes | Medium |
| A-010 | Accepted (Phase 14 owner reply) | Timezone edits | Recompute history in current profile timezone; retain original session timezone for audit | Predictable current-calendar summaries | Implemented in Phase 14; retain captured session timezone | High |
| A-011 | Accepted (engineering, Phase 05) | Sessions policy | 24-hour idle and 7-day absolute expiry; rotate on login and revoke on password changes | Reviewed initial policy under authorized implementation | Security hardening review in 17 | Medium |
| A-012 | Proposed | Content breadth gate | Inventory and prioritized requested-song backlog; no invented minimum catalogue count | No numeric target supplied | Owner reviews actual coverage before release | Medium |
| A-013 | Accepted (engineering, Phase 16; owner delivery question unanswered) | Reminders | Opt-in visible-tab delivery, optional explicit browser permission, in-app fallback; no closed-browser guarantee | Local-first implementation without push infrastructure | Revisit only if reliable closed-browser delivery is requested; ADR-0022 | Medium |
| A-014 | Proposed | Email | Replaceable mail adapter; local capture for development only | Reset/verification need delivery online | Choose real delivery before public deployment | Medium |
| A-015 | Accepted (Phase 12 owner reply) | Guest songs | Require sign-in for song discovery and learning | Explicit owner confirmation | Favorites/collections remain private | High |
| A-016 | Rejected | Free lyrics assumption | Popularity or Roman script establishes reproduction rights | Conflicts with verified-rights baseline | Permission must be evidenced | High |

## Phase 01 review â€” 2026-11-08

A-009â€“015 reviewed and remain Proposed, with dependency-specific gates in docs/architecture/PHASE-01-BASELINE.md. No product approval inferred. Architecture contracts and lifecycle choices establish the engineering baseline; runtime verification follows. User requests a brief usable-functionality summary at the end of every phase; this is an accepted reporting requirement.

## Phase 02 engineering decisions — 2026-11-08

A-017 (Accepted engineering choice): use existing Node 24 and Python 3.14 for this foundation; local package installation and checks validate this combination. Reassess provider runtime support in 19. No global runtime changes.

A-018 (Accepted engineering choice): npm workspaces with exact npm lock and pip/venv with exact transitive development lock; no mandatory uv or Docker/database for Phase 02. Phase 03 introduces PostgreSQL. Source imports and architecture rules are established incrementally rather than by empty folders.

A-019 (Known limitation): full npm audit reports 10 moderate development-tool findings from minimatch dependencies; production audit reports zero. Attempted scoped override did not resolve npm workspace transitive resolution and was removed. No force downgrade applied. Track upstream lint tool fixes; no claim of vulnerability-free dev tooling.

## Phase 03

A-020 (Accepted engineering decision): synchronous SQLAlchemy/psycopg with bounded pool, explicit transaction contexts, pre-ping and lifecycle disposal. Health DB work uses synchronous route workers, not the event loop. Database optional for liveness, required for readiness.

A-021 (Accepted engineering decision): PostgreSQL 17.9 Compose local service; baseline Alembic revision has no business tables. Real PostgreSQL disposable tests validate migration chain and rollback. Direct migration URL may differ from application URL.

A-022 (Accepted engineering decision): allowlisted JSON logs omit raw exception/request payloads. Generated request IDs correlate safe failure events. No external error-monitoring service selected (NFR-OBS-005 MAY).

## Phase 04

A-023 (Accepted engineering scope): minimal account anchor plus private notes establish ownership/FK/cascade behavior before feature workflows; no identity API or workspace UI added. Detailed future entity/retention map lives in DOMAIN-AND-DATA-MODEL.md.

A-024 (Accepted engineering choice): reference seeds are explicit, idempotent and non-overwriting; no song or user data seeded. Note account deletion cascades private rows; shared reference data remains independent. Exact future audit retention remains a pre-release decision. Tuning aggregate cardinality is enforced by domain validation, while independent ranges/FKs are SQL constraints.

## Phase 06

A-027 (Accepted engineering): same-origin /api/v1 rewrite with server-validated cookie session; client guard never replaces backend authorization. CSRF stays in memory; expired API sessions clear client state. No new product decision. A-028: generated OpenAPI JSON/types and drift checks; complete real-API browser harness on isolated ports/database. A-029: one additive chord-display preference migration completes onboarding inputs; full dashboard and learning tools remain later phase scope. Local launcher creates ignored credentials only for a new volume and preserves existing data.

Phase 07: reviewed song identities are a minimal prerequisite; full catalogue/content population stays in 12. No invented song seed or practice totals. Workspace storage uses typed kinds; legacy notes preserved for later consolidation.

Phase 08: 440 Hz reference, manual target selection, worker-local YIN-style detector and five-cent indicator band. Physical hardware calibration remains open; synthetic browser results never substitute for real instrument measurements.

Phase 09: generated/structured standard-tuning voicings are mathematically validated, not expert-reviewed. Custom names are labels. Bass initially major/minor; optional easier-voicing recommendation unselected. Public provider may be replaced by managed catalogue in 15.

Phase 10: ADR-0015 accepts 30–300 denominator-note BPM, four meters, local synthesized clicks and 150 ms lookahead. Meter changes reset; settings affect already-queued beats after at most that horizon. Background/sleep continuity is not guaranteed. No account, microphone, persistence or new service is required.

Phase 11: ADR-0016 selects STR-018 private custom patterns. Patterns require sign-in under existing guest-access policy; no new guest catalogue permission inferred. One measure with 1/2/4 equal subdivisions and D/U/R/X notation, 30–300 denominator-note BPM. Twelve original exercises are project-authored, not copied song arrangements. Shared publication requires manager/admin review and rights attestation; private patterns have no sharing endpoint. Settings edits stop playback. Shared audio transport prevents duplicate scheduling in combined pattern/metronome playback.

Phase 12: A-015 is now Accepted by explicit owner reply: song discovery/learning requires sign-in; private saves remain owner-only. Owner confirmed no licensed popular-song lyrics/arrangement source yet. ADR-0017 records 85 verified metadata identities plus six separately counted original practice songs, component-specific grants, worldwide-only initial publication, immutable staged import/revision checks and no source fabrication. Popular learning content remains a rights-acquisition gap, not an implementation success claim. One optional collection per favorite retains the existing Workspace model. Metadata aliases/language classifications and original difficulty/text are editorial guidance, not expert certification. ADR-0018 records necessary capacity/diagnostic safeguards after a parallel browser registration failure.


Phase 13: ADR-0019 selects persisted UTC active intervals, one unfinished session/account, explicit save, four-hour confirmation and 24-hour active bound. Captured profile timezone preserves evidence; A-009/A-010 calendar and historical timezone proposals remain for Phase 14. Time correction explicitly replaces pause segments. Immutable routine snapshots survive template edits/deletion. Daily/weekly goal setting versions preserve history without precomputed totals. PRA-021 guided tools selected. UNI-005 deterministic recommendations not selected for this phase; decision revisited in Phase 16. No additional owner product decision blocked Phase 13. No popular-song grant or hardware calibration claim added.


Phase 14 owner reply (2026-11-09) accepts A-009/A-010: Monday weeks, any positive saved active time qualifies a day, split intervals at local midnight and recompute historical summaries in current profile timezone while retaining captured timezone. ADR-0020 records implementation. UNI-025 weekly review MAY selected. Historical goal results use the goal version active at each period close (current period uses now); paused/unconfigured targets have no completion result. This is a documented engineering rule, not a claim of a separately approved product decision. Roadmap completion is explicitly self-reported per owner/instrument; changing skill reorders suggestions without silently completing anything.


## Phase 15

A-031 (Accepted engineering): reference documents become authoritative for guest tuner/shared chord catalogue; original shapes and presets are adopted by non-overwriting seeds. Saving a published item as draft withdraws it until republished; no separate parallel draft branch. Per-component current worldwide (`*`) grants gate publication. Reports are owner-private with identity-redacted manager views and fixed dispositions; actor audits anonymize on deletion. Existing timestamps begin at migration time without invented authorship. Additional instrument definitions extend the tuner only; baseline practice/profile/chord families remain. See ADR-0021. Owner explicitly selected an existing account for content-manager provisioning in the Phase 15 conversation; no other role changes are authorized. Previous assumptions/history remain intact.


## Phase 16

A-013 engineering selection (2026-11-10): the owner was asked about visible-app versus reliable closed-browser delivery and has not replied. After allowing a response opportunity, the implementation assumption was stated explicitly: visible signed-in tabs check optional reminders; browser permission is requested only after explanation and a separate click. No answer or owner approval is inferred. The SRS does not require reliable closed-browser delivery. One reminder per account/local calendar date, selected weekdays, scheduled minute plus a ten-minute grace window, current profile timezone, skipped nonexistent DST time and deduplicated repeated DST time are documented engineering rules. A successful server claim prevents duplicate tabs but cannot guarantee display after a crash/network interruption. No service worker, push subscription, email reminder or background scheduler is selected.

A-032 (Accepted engineering, Phase 16): select UNI-005 deterministic routine suggestions (previously deferred in 13), UNI-010 random transitions, UNI-021 self-reported timed challenge, UNI-022 note finder, UNI-023 approved text passage/cue practice and NTF-004 optional browser notifications. UNI-023 does not supply recorded-song looping/time stretching: no verified recording/playback rights are available. Sound is synthesized locally, never instrument-recognition scoring. Self-assessments do not grant practice credit; only explicit saved practice sessions do. Ear-training scores are page-local. ADR-0022 defines bounds and privacy/retention.

A-033 (Accepted engineering prerequisite, Phase 16): preserve the dirty Phase 15 checkout and personal database. Implement in codex/phase-16 isolated worktree; provide a separate persistent preview database and 127.0.0.2:3001 hostname for cookie isolation. No personal accounts or unfinished local song-player changes are copied, no role is granted, and no existing database is migrated by this preview. This is a local preview, not a deployment/provider decision.


## Phase 17 — 2026-11-11

A-034 (Accepted engineering): versioned personal JSON export requires cookie session, Origin/CSRF, current password and explicit confirmation. Unlike deletion it does not require email verification, because the authenticated owner can already read these records. This refines the older proposed verified-export contract in IDENTITY-AND-SESSIONS.md; the verified-email deletion guard remains unchanged. Five attempts/account/action/15 minutes applies. Explicit owner/field projections exclude secrets, deleted payloads, supplier/shared content and other accounts.

A-035 (Accepted engineering): startup and 15-minute cleanup remove expired security records and captured local codes; stopped apps resume cleanup at restart. Account deletion removes matching local capture and cascades all private stores, including retry records; shared actor links anonymize while provenance stays. Independent exports/backups remain outside active-database deletion; provider retention/restore procedures remain public-deployment gates. Auth changes discard private component state and send only a generic cross-tab reload signal on supported browsers.

A-036 (Accepted engineering): production HTTPS scheme enforcement, exact HTTPS origins, secure __Host- cookie lifecycle, restrictive response headers and limited non-owner runtime credentials. The API rejects supplied migration credentials. Current Next bootstrap requires inline scripts/styles in CSP; no strict nonce policy or public TLS verification is claimed. Development loopback migration-owner credentials must not be reused in production.

A-037 (Temporary engineering exception, not owner approval): nine moderate npm development audit entries derive from GHSA-g3hv-75wg-m249. A patched override produced an invalid dependency tree and a clean resolve failed the existing peer tree; those trials were restored. Runtime npm and all 47 pinned Python-package scans have zero observed findings. CI permits only this dev-marked advisory graph until 2026-12-11, rejects unknown/runtime/high/critical/expired findings and fails on incomplete scans. Compatible upstream lint remediation remains required; never run it against untrusted configurations.

A-038 (Accepted local continuity): Phase 17 uses codex/phase-17 in .artifacts/phase17-worktree, based on completed Phase 16; original song/player edits stay outside the security review. Current preview is a separate chord-house-preview project, host 127.0.0.3:3002, API 8002, DB 5435. Earlier apps/previews and personal databases are preserved. Full C: disk/package-cache relocation and Docker runtime availability are recorded honestly in the phase report; no shared service restart is inferred as authorized.

A-038 operational update: the owner explicitly replied "Restart Docker and activate the preview". A targeted Docker engine restart restored existing apps and the separate Phase 17 preview without deleting volumes or stopping Ubuntu. Real local Edge export/deletion and session-revocation checks passed; the disposable test account was deleted. The preview is running at http://127.0.0.3:3002. This operational authorization does not approve unrelated product/security exceptions.

ADR-0023 and SECURITY-AND-PRIVACY.md define review/retention/provider/accessibility evidence and residual limits. No new scoped MAY rows exist. No legal compliance certification, new popular-song permission, provider approval or hardware evidence is inferred.

## Phase 18 — 2026-11-11

A-039 (Owner/device evidence): owner offers the current computer and Google Chrome, then replies "Just Do Yourself" to the exact physical-string procedure. Agent-run generated capture and installed-browser checks proceed; no guitar pluck, exact GuitarTuna comparison, physical microphone calibration or listening result is fabricated. Earlier approximate 81.x/109.x E2/A2 evidence remains inconclusive; no arbitrary offset is applied.

A-040 (Accepted engineering): ADR-0024 defines raw measured evidence and broad regression budgets, three-engine full journeys, mobile emulation and opt-in installed Windows Chrome/Edge checks. Official Playwright image matches locked 1.65.0; Noble/Ubuntu 24.04 runtime alignment and container-home ownership are setup corrections, not reduced assertions. No new scoped MAY rows. REL-003 provider backups remain explicitly conditional on Phase 19 provider/restore configuration rather than counted complete.

A-041 (Accepted local continuity): isolated Phase 18 worktree/branch are based on 35b5d86. Reuse existing Phase 17 preview project, credential, mail and DB volumes at 127.0.0.3:3002/API8002/DB5435; no personal data copy or additional DB. Head remains 0012. Rebuildable host-tool caches are preserved on D: with links after C: exhaustion; Docker recovery uses the owner's earlier explicit restart authorization. Previously running original services are restored; unrelated previously stopped services remain untouched. The report records actual results and activation.

Phase 18 final gate: 80/86 browser checks pass; six Firefox/WebKit cases remain unresolved. Implementation is delivered but Phase 18 is not complete; see PHASE-18-REPORT.md. No Phase 19 start or requirement deferral is inferred.


## 12 November 2026 — accepted song library amendment

D-20261112-01 — Confirmed owner decision: open registration, shared song reading/playback for every signed-in user; no invitation/approval gate. D-20261112-02 — Preserve the preferred current root song/player/lyrics behavior while reconciling earlier Phase 17 security; branch numbering alone does not identify the accepted source. D-20261112-03 — Accepted folder-based expansion; optional generated metadata may stabilize identities, but hand-written song JSON is not required. D-20261112-04 — Proposed technical starting point: evaluate Neon Free PostgreSQL plus private Object Storage, with R2/Supabase alternatives. Provider/account/region/billing remain Phase 19 decisions based on current capabilities. No licensed source has been established in chat; hard-coded permission assertions in existing code are not evidence. Archive and dated amendments preserve earlier decisions/history.

Details: [accepted baseline and added requirement IDs](OWNER-SONG-LIBRARY-BASELINE.md), [storage and migration plan](SONG-LIBRARY-STORAGE-PLAN.md), and revised [Phase 18](phase-prompts/PHASE-18.md), [Phase 19](phase-prompts/PHASE-19.md), [Phase 20](phase-prompts/PHASE-20.md). These dated decisions supersede conflicting earlier proposals only for their stated scope.


## Revised Phase 18 implementation

See [local asset operations](../architecture/SONG-ASSETS.md) and [ADR-0025](../adr/ADR-0025.md) for migration 0013, scan/sync/rename commands, source preservation, streaming, privacy and limits. Online object storage remains Phase 19; current verification status is in [the report](Phase-Reports/PHASE-18-REPORT.md).
