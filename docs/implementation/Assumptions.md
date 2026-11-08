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
| A-009 | Proposed | Calendar rules | Monday week start; positive saved active duration qualifies a practice day; split intervals at midnight | Deterministic testable default | Confirm before phase 14; preserve seconds and show rounded minutes | Medium |
| A-010 | Proposed | Timezone edits | Recompute history in current profile timezone; retain original session timezone for audit | Predictable current-calendar summaries | Review in phase 01/14 | Medium |
| A-011 | Accepted (engineering, Phase 05) | Sessions policy | 24-hour idle and 7-day absolute expiry; rotate on login and revoke on password changes | Reviewed initial policy under authorized implementation | Security hardening review in 17 | Medium |
| A-012 | Proposed | Content breadth gate | Inventory and prioritized requested-song backlog; no invented minimum catalogue count | No numeric target supplied | Owner reviews actual coverage before release | Medium |
| A-013 | Proposed | Reminders | In-app reminders while running; no promise of closed-browser delivery | Avoid unapproved background infrastructure | Confirm delivery expectations in 16 | Medium |
| A-014 | Proposed | Email | Replaceable mail adapter; local capture for development only | Reset/verification need delivery online | Choose real delivery before public deployment | Medium |
| A-015 | Proposed | Guest songs | Require sign-in for song learning until access policy reviewed | Only three guest tools explicitly authorized | Decide before 12 | Medium |
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
