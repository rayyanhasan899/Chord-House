# Administration and content operations

Sign in as a content manager or administrator and open `/admin`. Ordinary accounts see a permission explanation, and the server independently rejects management requests. Both privileged roles can manage shared catalogue content; neither can inspect or adopt another account's private patterns, chords, practice or notes. No role-management HTTP endpoint is provided.

Select instrument, tuning, chord, pattern or song. Create or edit an entry using the labeled fields. Song arrangements, multilingual text variants, placements and their separate permission grants have expandable structured editors. Stable codes identify reference entries; song/pattern IDs are UUIDs. Lists use explicit previous/next pages. Close the editor before changing type or page; unsaved input is retained after failed saves. Reload and reopen after a revision conflict.

Save draft, Publish reviewed content and Archive content are separate actions. **Saving a draft of published content removes its availability immediately.** Archival preserves stable identifiers and history instead of destructive deletion. Publication requires structural validation and current reviewed worldwide display/cache permission (`*` territory). Each metadata, arrangement and text grant is independent. The expiry field accepts an ISO date/time with timezone, such as `2027-01-01T00:00:00Z`; blank means no specified expiry. Source must be HTTPS. Review checkboxes record operator attestation; they do not acquire legal rights. Roman transliterations need their own verified grant.

For emergency song withdrawal, open the song and use Withdraw rights: entire song (metadata), named arrangement, or named text variant. Text withdrawal also removes its displayed chord placements. The editor excludes withdrawn components when reopened, avoiding accidental routine restoration. Explicitly supplying newly reviewed content can restore it. Other shared content is withdrawn by archival. Expired content is removed on subsequent catalogue reads; no scheduled task or shared response cache is required. Reference pages refresh on focus/every 30 seconds. Copies already delivered to browsers cannot be recalled.

Chord entries represent individual voicings, each with its own code. Standard guitar/bass/re-entrant ukulele frets, finger consistency, span, complete chord-tone set, root and quality are validated. The 198 preexisting original mathematically generated voicings are packaged as non-overwriting managed seeds; no newly licensed material is claimed. The main chord library reads managed entries. Existing local musical construction helpers remain for synthesizing/deriving chord diagrams in other learning tools. Tuner choices read managed instruments/tunings and require a matching string count; archiving an instrument suppresses its tunings. Instrument string count cannot change once any tuning references its code: create a new code instead. Additional instrument definitions are usable by the tuner; practice/profile and chord synthesis still use the four baseline instrument types, rather than claiming support for arbitrary instrument techniques.

Reference catalogue storage is authoritative for the tuner and shared chord library. Legacy relational Phase 04 definitions remain as non-overwriting bootstrap inputs and for existing compatibility; new managed edits are not copied back into those legacy rows. Seed runs preserve managed edits, archives and expired grants. Existing song/pattern identities and private favorites remain unchanged. Pre-Phase-15 original shared patterns can retain their prior review/rights statement; every new shared-pattern publication, including the earlier API, requires a full grant. Editing an older pattern in Administration presents a new unreviewed grant to complete before publishing.

## Imports and corrections

Choose a JSON catalogue pack shaped as `ImportInput` (API `/docs`, or the existing song import CLI guide). A pack contains a unique key, an explicit `replace_existing` flag and up to 200 SongInput items. The UI limits files to 5 MB. Stage import creates an immutable preview with duplicate/replacement/rights issues. Review all supplied song components, acknowledge review, then explicitly publish. The server rechecks expiry and original revisions atomically at commit. Repeated identical keys are idempotent; different content needs a new key. Failed previews never publish. Import history allows another authorized editor to reopen the exact staged document. The editor's structured fields are used for individual corrections; source packs are corrected externally and restaged under a new key.

Signed-in users can follow Report this song/pattern/tuning, or open `/reports` with a shared catalogue code. Their report body and outcome are visible only to themselves and authorized managers. Managers see the target, body, status and dates, without reporter ID/email/profile. Authors should not include private details in free text. Other users cannot list or resolve the report. Correct catalogue content first, then mark corrected, dismissed or reopen. Resolution states are fixed labels, so internal reply text cannot leak private data back to the reporter. Archival keeps the report target stable. Account deletion deletes that account's reports.

The audit screen pages through actions with actor account UUID (or system/anonymized), target and UTC timestamp rendered in browser local time. No report text, email, password, tokens, content body or permission evidence is recorded. Role provisioning is recorded as an operator event without impersonating a user. Deleting an actor anonymizes its audit FK. New Phase 15 events are listed here; previous song-specific audit records remain in `song_audit_events` and are not retroactively fabricated or merged into new events. Retention is local until the pre-release retention policy is finalized.

## Setup and API

Apply `python -m alembic upgrade head`, then `python -m app.modules.catalog.seeds` from backend with its normal database configuration. Migration `0011_content` adds managed references, private reports, redacted audit, and existing song/pattern modification metadata. Existing timestamps start at migration time; authorship before this phase is not invented. Up/down/up and Alembic metadata drift are tested only on disposable PostgreSQL. Downgrade removes the new report/audit/reference data: backup and review before rollback on a real database.

To provision an explicitly selected, email-verified account, the trusted local operator runs `python -m app.modules.content_management.operator ACCOUNT_UUID content_manager --confirm` from backend. Choose `admin` only when necessary, or `user` to revoke. The account UUID is returned by its own `/api/v1/me`. This is an operator command with database authority, not self-service promotion. Refresh the account session to update navigation. Backend permissions are read from the account on each request. No new package, provider, credential or paid dependency is required.

New routes (all `/api/v1`):

| Route | Access and purpose |
|---|---|
| GET `/reference-content/{instrument,tuning,chord}` | Guest-readable available reference pages; actor IDs redacted |
| GET `/content/{kind}` | Managers: paged shared entries in every state |
| PUT `/content/{kind}/{key}` | Managers: create with revision 0; update with current revision, document and status |
| GET `/content-imports` and `/{id}/document` | Managers: paged imports and complete immutable review payload |
| POST `/content-reports` | Account: report existing available shared content |
| GET `/content-reports` | Own reports; `managed=true` requires manager |
| PUT `/content-reports/{id}` | Manager: revision-checked disposition |
| GET `/content-audit` | Manager: paged redacted events |

Existing `/song-imports`, `/managed-songs/{id}/withdraw`, `/managed-patterns` retain server role, cookie, CSRF, Origin and rate checks. Management/report/reference responses use no-store. No private identifier is accepted as proof of ownership. OpenAPI is regenerated and checked in CI. Exact runnable validation and limitations are recorded in the Phase 15 report.

Song coverage remains 91 initial entries: 85 metadata-only popular identities and six original practice songs. No popular-song lyrics, Roman text or arrangements were acquired by adding Administration. The desired comprehensive learning catalogue still requires rights-cleared content acquisition and an owner-approved breadth target.
