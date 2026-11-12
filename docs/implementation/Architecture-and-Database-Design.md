# Architecture and database design

## Phase 16 implementation refinement

ADR-0022 and ../architecture/TRAINING.md define the training hub and integration module. Migration 0012_integration adds owner-cascaded training_assessments (UUID retry uniqueness, nullable JSON payload/tombstone), practice_reminder_preferences (owner PK, optimistic version constraint) and practice_reminder_deliveries (owner/local-date composite PK). Account-row locking serializes retry/delete/settings/claims; current timezone comes from the account. Existing Practice sessions/routines remain the saved-time/routine stores. Earlier planned ExerciseAttempt/ReminderPreference allocation to Practice is refined to integration-owned persistence. Questions/audio are browser-local and ear scores ephemeral. Pure reminder_due and pitch/sequence functions separate rules from adapters.

Visible-tab reminders are a stated engineering contract, not an inferred owner answer or closed-browser guarantee. Approved-text passage loops use generated line cues, separate from recording playback rights. A separate persistent local preview preserves the dirty older checkout/database; this is not a hosting-provider decision.

Retain Next.js/TypeScript/Tailwind/shadcn/ui, FastAPI/Pydantic, PostgreSQL/SQLAlchemy/Alembic; feature modules in a layered modular monolith. Framework-independent domain and application contracts; persistence adapters wired in composition. No microservices, Redis or paid AI needed. Frontend routes compose feature UI; browser audio owns real-time processing. Prefer same-origin browser/API routing to simplify secure cookies and CSRF. Generate frontend types from versioned OpenAPI and check drift in CI.

Identity owns User, Profile, Preferences, Session (hashed opaque token, expiry, revocation), one-use verification/reset tokens and roles. Preferences include IANA timezone, instrument, tuning, skill, handedness and theme. Passwords securely hashed; never log tokens. Session rotation, CSRF tokens/origin checks, explicit CORS and production Secure/HttpOnly/SameSite cookies. Final timeout constants are proposed in assumptions.

Catalog owns Instrument, TuningPreset, ordered TuningString with explicit octave/MIDI pitch, Chord, Voicing and ordered StringPosition, StrummingPattern and timed Stroke, Song, Artist, SongArtist, SongAlias, Arrangement, SongTextVariant, Section and ChordPlacement. Language (en/ur/hi) and script (Latn/Arab/Deva) are separate; Roman variants use ur-Latn/hi-Latn semantics and retain provenance. Unicode originals plus normalized alias search; do not pretend automatic transliteration is authoritative. Index normalized title/artist/aliases and language/difficulty/tuning filters; PostgreSQL search adapters allow later tuning after profiling.

ContentSource, RightsGrant, Attribution and ContentRevision attach separately to metadata, arrangements and text variants. Track source URL/provider ID, terms version, permitted display/cache/export, territory, expiry, reviewer and review status. Publication checks approved rights and review; withdrawals/expiry remove public text and invalidate caches. ImportBatch/ImportItem supports validation previews, stable external keys, duplicate review and idempotent retries. Catalogue scale is not limited to seed fixtures. Phase 12 records real inventory by language, arrangement and lyrics availability, and a prioritized expansion backlog. Admin UI in 15 maintains it.

Workspace owns Task, Favorite, Collection, CollectionItem, LearningNote, PrivateCustomChord and PrivateCustomPattern. Every private row has non-null owner FK; joins and linked records are authorized too. Unique owner/target favorites and collection memberships; reject unauthorized links. Private customs have no public publication endpoint.

Practice owns PracticeSession, active timer state, PracticeGoal with effective dates, Routine/RoutineItem, Roadmap/Milestone/UserMilestone, ExerciseAttempt and ReminderPreference. Store instants in UTC and IANA timezone metadata. Persist active duration in seconds and distinguish unsaved/paused/saved. Proposed day splitting uses saved active intervals across local midnight; aggregate seconds before displaying minutes. Recompute affected summaries transactionally after edit/delete; idempotency keys prevent duplicate saves. Test DST, week boundaries, timezone changes and overlapping intervals. Derived summaries are not independent mutable truth.

Content management owns moderation Report and AuditEvent. Keep actor/reference/time/action without secrets or unnecessary private payloads. FKs, uniqueness/check constraints and reviewed cascade/anonymization policies protect consistency; indexes start with owner/date and catalog filters. All schema changes use Alembic with fresh-upgrade and representative data tests. No ORM auto-create deployment. Phase 04 produces reviewed ERD and deletion matrix; actual migrations accompany the responsible feature slices.

Visual proposal: warm neutral surfaces, restrained amber accent, readable song typography, clear tool panels, light/dark themes and responsive keyboard-accessible controls. Status uses text/symbols as well as colour. All UI phases include loading/empty/error/offline/permission states. No visual generation or website publishing is part of this planning stage.

Phase 12 implementation detail: ADR-0017 uses relational stable SongReference identity plus versioned validated JSONB SongRecord component/grant documents and immutable SongImportRecord batches. This replaces the earlier proposed separate arrangement/text/grant tables for this slice while retaining component-level validation, expiry, provenance and withdrawal; future measured search projections can normalize without changing stable identity. SongAuditRecord records catalog administrative actions. Existing Workspace favorites/collections are reused with owner/song uniqueness; one optional collection per favorite. Authenticated song access was explicitly confirmed by the owner. Exact initial content and gaps live in SONG-CONTENT-INVENTORY.md/JSON.


## Phase 13 implemented practice persistence

Migration 0009 adds practice_sessions, practice_starts, practice_routines, practice_activities and practice_goals (ADR-0019). Sessions persist UTC active intervals, running anchor, captured timezone, version and immutable routine snapshot. Saved state is the sole future progress input; no duplicated aggregate counter exists. Owner locking serializes writes and saved interval collision checks. Goals are effective-dated versions, with one current daily/weekly target. Optional links SET NULL and account cascades preserve ownership/deletion semantics. See ../architecture/PRACTICE.md for endpoints, UI, lifecycle, retry and timer limits. Phase 14 owns derived statistics/calendar policy.


## Phase 14 progress and roadmap

Saved intervals are allocated by current account timezone in pure progress_domain functions with integer microsecond accounting and UTC elapsed durations. Progress service uses coherent repeatable-read snapshots; no aggregate counter can become stale after edit/delete. Goal versions are evaluated at period close. Migration 0010 adds owner/instrument/milestone completions and owner/week reflection text/version, both account-cascading. Request/response contracts and authenticated practice routes compose the service; frontend Progress is reused for full /progress and compact dashboard summaries. ADR-0020 and ../architecture/PROGRESS.md hold detailed behavior and owner-approved calendar rules.


## Phase 15 content operations

content_management owns managed_references, content_reports and content_audit; repository contracts compose existing song/pattern aggregates with new reference documents. Migration 0011 adds timestamps/actor metadata to shared aggregates and indexes/constraints/retention FKs. Managed-reference instrument cardinality/link checks run under transaction locks; archival preserves keys. Reports cascade with owners; audit actors SET NULL. ADR-0021 and ../architecture/CONTENT-OPERATIONS.md define lifecycle, provenance, API and operator setup. No private catalogue items enter management views.


## Phase 17 security/privacy layer

Security owns the PersonalExport DTO, pure JSON value conversion, ExportSource protocol, explicit SQL export repository, reauthentication coordination, body limiter and expired-security maintenance. Routes compose the repository with existing identity/password adapters; export queries use coherent owner-scoped snapshots and field allowlists. No ORM introspection dumps credentials. No schema/table change is required; head remains reviewed 0012_integration, whose existing FK cascades/SET NULL links are exercised across all private stores and shared history. Startup and 15-minute cleanup own their task lifecycle and redact failures. API transport/cache/header hardening and runtime-role checks stay in composition/infrastructure; browser auth-boundary remount/BroadcastChannel reset, account confirmation forms and POST fallback remain presentation concerns. ADR-0023 records retention, role/proxy/CSP decisions and the bounded dev audit exception.

## Phase 18 measured quality

ADR-0024 and QUALITY-AND-COMPATIBILITY.md separate controlled-signal, browser-engine, installed-browser and physical-device evidence. Catalog read adapters use ListingDocument/ListingArrangement/ListingText projections to avoid revalidating/copying every full score and lyric on list requests; live grant/expiry/withdrawal rules and private, no-store responses remain authoritative. Detail/write validation stays complete. Differential tests compare list counts/filtering/pagination against rights-aware details. Existing status/language indexes and streamed candidates remain; no migration, extension or cache. Head remains 0012_integration. Tuner presentation unlocks audio in the Start gesture and owns interruption cleanup; chord SVG title/readiness fixes prevent hydration and premature actions. Quality tooling is not a production domain service.


## 12 November 2026 — accepted song library amendment

Add a storage port with local and private-object-storage adapters behind existing application services and server-managed cookie authentication. PostgreSQL holds stable song IDs, asset revisions, keys, checksums, availability, provenance/rights and import results; object storage holds original MP3/text bytes. Design reviewed migrations for these fields, explicit rename mapping and stable favorites/collection references. Authenticated backend GET/HEAD/range streaming serves all signed-in users; only operators mutate shared content. Stage and verify uploads before transactional active-reference changes, with idempotent resume, copy retention and matched database/media restore. No distributed-transaction claim, silent remote deletion or authentication-provider migration.

Details: [accepted baseline and added requirement IDs](OWNER-SONG-LIBRARY-BASELINE.md), [storage and migration plan](SONG-LIBRARY-STORAGE-PLAN.md), and revised [Phase 18](phase-prompts/PHASE-18.md), [Phase 19](phase-prompts/PHASE-19.md), [Phase 20](phase-prompts/PHASE-20.md). These dated decisions supersede conflicting earlier proposals only for their stated scope.


## Revised Phase 18 implementation

See [local asset operations](../architecture/SONG-ASSETS.md) and [ADR-0025](../adr/ADR-0025.md) for migration 0013, scan/sync/rename commands, source preservation, streaming, privacy and limits. Online object storage remains Phase 19; current verification status is in [the report](Phase-Reports/PHASE-18-REPORT.md).
