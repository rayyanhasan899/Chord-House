# Phase 01 technical baseline

Established 2026-11-08. Engineering baseline is ready for Phase 02; no application exists. Original SRS and blueprint are unchanged. Later explicit user decisions govern product choices; unresolved proposals remain proposals. No phase 00 report is required: the initial planning package is the prerequisite.

## Contracts and dependencies

| Owner | Application contract | Consumers | Transaction boundary |
|---|---|---|---|
| identity | Register, Authenticate, ResolveActor, RevokeSession, UpdateProfile, ExportAccount, DeleteAccount | API dependencies and personal modules | Account/session changes atomic; password changes revoke sessions |
| catalog | SearchSongs, GetPublishedArrangement, ResolveVoicing, GetTuning, ValidateReference | workspace, practice, content management | Reads only published permitted components; paginate lists |
| personal_workspace | ManageTasks, SaveFavorite, ManageCollection, SavePrivateChord/Pattern, ManageNote | authenticated UI and dashboard | Actor-scoped mutations and linked-target validation |
| practice | Save/Edit/DeleteSession, ManageGoal/Routine, GetProgress, CompleteMilestone | dashboard and guided practice UI | Saved intervals and affected aggregates updated atomically; retry deduplication |
| content_management | StageImport, ReviewContent, Publish/Withdraw, ReportIssue | restricted admin UI and reporting UI | Publish checks rights and review; audit action committed with change |
| browser audio | Start/StopCapture, EstimatePitch, ScheduleBeat, PreviewChord | tuner, metronome, patterns, training | Resources owned by active feature; stop/unmount releases tracks/nodes |

HTTP handlers validate transport, resolve actor, call use cases and map typed errors. Domain has no FastAPI/React/SQLAlchemy imports. Repository protocols expose domain objects or explicit query DTOs; persistence implements protocols. Composition wires scoped sessions/unit-of-work and adapters. Domain rules never live in ORM models or route handlers. Modules call owning application contracts rather than importing another module's tables. Dashboard uses read-model contracts; no arbitrary cross-module SQL. Use /api/v1, generated OpenAPI types, field-level validation errors and request IDs; exclude internals and sensitive fields from responses. Pagination has bounded limits and stable ordering. No credential storage in browser localStorage.

## Ownership and lifecycle

| Data | Owner/access | Delete/archive behavior |
|---|---|---|
| Profile/preferences/sessions/tokens | authenticated account; sessions hashed at rest | account deletion removes profile and revokes sessions/tokens |
| Tasks/notes/favorites/collections/custom chords/patterns | actor owner only, including nested links | delete with account; no public custom-item endpoint |
| Sessions/goals/routines/attempts/milestone progress/reminders | actor owner only | delete with account; session edit/delete invalidates derived progress |
| Songs/arrangements/text/voicings/tunings/shared patterns | published reads subject to access and rights policy; manager writes | archive referenced records; omit withdrawn components publicly |
| Rights/source/revisions | manager-controlled provenance | retain only necessary lawful nonpersonal provenance; expire public access on withdrawal |
| Reports/audit | restricted staff; reporter details never public | anonymize account references; retention period must be established before public launch |

Every private table has non-null owner FK; owner comes from resolved session. Nested child queries scope through parent owner; reject another user's target links. Favorites use typed target associations with enforceable FKs rather than unvalidated polymorphic IDs. Unique normalized email, owner-target favorite uniqueness, ordered tuning string uniqueness, nonnegative bounded duration and valid time ordering are database constraints. UTC timestamps and explicit IANA timezone are required. Detailed ERD/migrations follow in 04; no speculative empty tables now. Data export excludes password hashes, session/reset tokens, internal moderation and unlicensed provider payloads.

## Threat boundaries and required controls

| Boundary/threat | Required control | Evidence phase |
|---|---|---|
| Browser→API: forged owner/IDOR | actor-derived owner and authorization on every operation | 05 onward; exhaustive audit 17 |
| Cookie session: fixation/theft/CSRF | opaque random token, hashed storage, rotation, expiry/revocation, Secure/HttpOnly/SameSite, CSRF and origin checks | 05 and 17 |
| User input/content: injection/XSS | parameterized SQL, bounded validated input, text-safe rendering, allowlisted rich content | feature tests and 17 |
| Provider→import: unlicensed/malicious content | replaceable adapter, no arbitrary URL fetch, staged review, component-specific rights and safe rendering | 12/15 |
| Guest→private/admin APIs | deny by default; role and owner checks server-side | 05/07/15/17 |
| Microphone→browser | explicit start, no audio upload, cleanup and permission errors | 08/18 |
| Logs/export/backups | redaction, minimal data, protected backups and restore rehearsal | 03/17/19 |
| Public operations: abuse | login/register throttling, request bounds and safe errors | 05/17 |

No raw microphone recordings are persisted. Secrets remain in environment/secret settings. Offline saves must not show false success. Destructive account actions require confirmation and reauthentication; deletion/retention behavior must be shown clearly to the user. Account-wide deletion coordinates owned modules without circular dependencies; long-running deletion needs explicit status/retry semantics if later required.

## Measurable acceptance plan

- Baseline: all 450 unique SRS IDs mapped once to phases 01–20; eight added decisions remain visible; all 20 prompt files present; source fingerprints retained.
- Identity: successful registration/login/logout; expired/revoked tokens fail; User A cannot read/update/delete User B's records or children; normal users cannot publish content. Test each resource category, including exports and linked targets.
- Tuner: generated references for every preset note, bass E1, strong harmonics, noise, silence and weak signals; controlled clean-input target approximately ±5 cents (TUN-050). Report observed cents distribution and latency with sample rate, device/browser and fixture parameters. Calibrate against a reference and test real instruments; generated signals alone do not prove microphone accuracy.
- Metronome: record scheduled-versus-observed beat timing over several minutes at multiple BPM/meters, background/suspension behavior and immediate stop. Numeric timing budget must be established and justified during 10, not claimed here as measured.
- Songs: test title/artist/language/alias filtering and Roman variants; transpose root, quality and slash bass correctly without modifying source. Demonstrate real permitted learning content in each required language and report counts separately for metadata, arrangements and full lyrics. No invented catalogue-size commitment or rights evidence.
- Progress: deterministic fixtures cover saved versus unsaved sessions, pauses, duplicate submissions, DST/midnight/week boundaries, edits, deletes and timezone changes. Totals equal saved active seconds under the reviewed allocation policy.
- UI: mobile/tablet/desktop, keyboard and screen-reader alternatives, textual audio status and complete error/empty/loading states. Verify WCAG 2.2 AA target against actual rendered UI, not this document.
- Delivery: fresh checkout installs/builds/tests and upgrades a blank PostgreSQL database; secrets excluded; restore rehearsal and HTTPS smoke evidence before hosted release.

## Remaining decision gates

A-009–015 remain proposed: week/day allocation and timezone change semantics before progress; session timeout constants before identity; actual song-coverage target and lawful sources before song acceptance; reminders before integration; email delivery and hosting region/provider before public release; guest song policy before song routes. These do not block scaffolding. No additional user approval is implied by an engineering proposal. Core accepted choices are not reopened.

## Readiness verdict

Phase 01 baseline exit met: contracts, ownership/lifecycle, threats, acceptance and source reconciliation documented; traceability structurally verified. Phase 02 may scaffold. Runtime compatibility and application security/functionality remain unverified until code exists. No application feature is usable yet.
