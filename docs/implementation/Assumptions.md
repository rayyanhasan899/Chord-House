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
| A-013 | Proposed | Reminders | In-app reminders while running; no promise of closed-browser delivery | Avoid unapproved background infrastructure | Confirm delivery expectations in 16 | Medium |
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
