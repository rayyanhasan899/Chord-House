# Security, privacy and account data

Phase 17 implements ACC-024/025/027/028, NFR-SEC-001–014, NFR-PRI-001–008 and NFR-UX-001–009 under ADR-0023. See the phase report for exact executed gates and limits. The original uncommitted local song modules/player are preserved outside this branch and have not inherited this review.

## Use your controls

Sign in and open **My account → Your data and account**. Expand **Download my personal data**, enter your current password, acknowledge that the file is private and download. It is a versioned UTF-8 JSON file; Roman/native-script notes remain Unicode. It contains only your profile and private records, safe session/expiry dates and your redacted contribution-action metadata. No server copy of the export is retained. It is a data download, not an automatic restore/import feature.

For deletion, verify your email, expand **Delete account**, read the consequence, enter your current password, type DELETE and check the confirmation. Press **Permanently delete my account**. The success page confirms deletion and all sessions are revoked. Another account's records survive. On supported current browsers, other tabs refresh on a non-sensitive auth-change signal and clear private state. Export first if you want a copy; deletion cannot be undone within the app. Cancel simply means leaving the confirmation incomplete or navigating away.

Each export/deletion action has its own five-attempt account limit per 15-minute window. Generic failures retain privacy; 429 includes a conservative Retry-After of 900 seconds. This is in addition to existing authenticated-write and IP/email limits. All user-owned API operations derive the owner from the session, not supplied identifiers. Passwords are never put in URLs by these forms.

## API and export contract

`POST /api/v1/me/export` accepts `{current_password, confirm: true}`; the existing cookie, exact Origin and X-CSRF-Token are required. Unknown owner fields and non-boolean confirmation are rejected. Wrong password/missing confirmation is 403, absent session 401, invalid input 422, rate limit 429. Success is JSON with an attachment filename, no-store, `format = chord-house.personal-data.v1`, UTC exported_at, profile, records and a documented exclusions list. The browser creates/revokes a temporary object URL for the download; it never saves data to localStorage.

Explicit exports cover legacy learning notes, workspace tasks/collections/notes/favorites, custom chords/patterns, pattern favorites, routines/activities, all session states with stored intervals/snapshots, goals, roadmap completions, weekly reviews, saved assessments, reminder settings/date claims, safe session/email-action dates and the owner's redacted shared-action history. Active timer durations are the persisted snapshot, not an invented saved session. Goals/streaks are derived, so their input history is exported rather than a second mutable aggregate. Deleted assessment payloads and internal retry hashes are excluded. Credentials, password hashes, CSRF/session/email tokens, raw audio, other users' data and licensed catalog/supplier packs are excluded. Future personal stores must add an explicit projection; tests fail when an owner-linked table is omitted without an explicit internal-only exclusion.

`POST /api/v1/me/delete` retains `{current_password, confirm: true}`, requires a verified email and uses the same session/CSRF protections. The new UI adds typed confirmation; the backend continues to enforce authenticated ownership and a real boolean confirmation even for direct callers. Foreign-key cascades remove private rows and activities. All owner sessions/codes are removed; shared references and another user's data remain.

## Retention and deletion map

| Data | Retention / deletion behavior |
| --- | --- |
| Account/profile/private learning stores | Until user removal/account deletion; hard cascade on account deletion |
| Saved session intervals/goals/reviews | Until removal/account deletion; summaries recalculate from surviving saved records |
| Assessment payload | Cleared on assessment deletion; absent from export after deletion |
| Assessment/practice retry keys, reminder dates | Minimal operational identifiers/hashes until account deletion; prevent replay/duplicate reminders |
| Session verifier/CSRF | 24h idle/7d absolute validity; logout/password change/reset/deletion revoke as documented |
| Verification/reset codes | Single-use hashed codes valid 30 minutes; replaced codes invalidated |
| Rate buckets | Hashed keys with a 15-minute expiry; no raw email/IP in the stored key |
| Expired security rows/local captured mail | Startup and 15-minute cleanup while running; local capture also purges on new mail and matching deletion; stopped apps clean on restart |
| Shared catalog/import/audit/provenance | Retain shared content/history; account actor FKs become null on account deletion; no copied account profile in audit payload |
| Request logs | Only level/event/generated request ID/status/exception class; deployment logging transport/rotation must preserve this allowlist |
| Browser export / user-made backups | User-controlled copies; the app cannot recall them |
| Hosting/mail/backup provider copies | No provider configured here; public release requires actual retention/location/contact and restore-deletion procedures |

Cleanup is idempotent and may also be run from backend with an explicitly configured target: `python -m app.modules.security.maintenance --confirm`. It only deletes expired security rows and captured codes; it does not purge practice history. Failures produce a redacted security_cleanup_failed event. Do not point test/maintenance tools at an unintended database. Delivery already completed by SMTP cannot be recalled.

## Threat review

| Boundary / threat | Control and evidence |
| --- | --- |
| Guest to personal API; A to B identifier/linked-resource access | Backend current actor, owner predicates and authorized joins; guest/other-user mutation/export/cascade tests plus existing workspace/catalog/practice/progress suites |
| Role/mass assignment | Extra fields forbidden and explicit profile fields; manager checks live on backend; operator remains a separate trusted command |
| Cookie fixation, replay, idle/absolute expiry | Random opaque verifier, login replacement, current-session logout and all-session password/deletion revocation; production secure host cookie tests |
| Cross-site writes / CORS | Exact Origin plus in-memory session CSRF on unsafe requests; no browser cross-origin allowance; rejected Origin/token/preflight tests |
| Forged forwarded HTTPS / insecure production | Reject HTTP based on validated scheme, HSTS and Secure cookie; direct header spoof test; proxy trust must be limited operationally |
| Browser/shared cache and stale account state | API no-store including errors/workspace/chords; private component remount on identity change; generic cross-tab reload signal and deletion-tab browser journey |
| SQL/XSS/unsafe URLs | SQLAlchemy predicates bind values; source URLs validate HTTP(S); React escapes text, no HTML rendering path; CSP rejects external script/object/frame sources |
| Oversized bodies | 8 MiB declared/streamed cap; bounds/schema extra-field rejection; safe 400/413 tests. Import smaller batches rather than truncating a catalog |
| Error/log leakage | Sanitized validation fields, generic internal errors, parameter hiding and log allowlist; baseline core/log tests plus new negative security cases |
| Excess DB privilege | Production role inspection rejects admin/owner/CREATE/member/switched roles; real limited-role writes succeed and schema creation fails |
| Microphone/notifications | Browser-only worker/audio, explicit Start/Stop and explained opt-in; existing generated-capture test observes no POST, and denied permission journeys remain usable |
| Dependency supply chain | Exact lockfiles, runtime-zero audit gate, pinned Python audit and expiring development-only exception; this is not a malware/signature certification |

Known baseline tradeoffs remain explicit: registration duplicate status and synchronous eligible SMTP delivery can reveal address existence; no claim of enumeration resistance is made. Public recovery/delivery needs review with the actual provider, including bounded delivery latency and uniform generic responses. CSP retains inline Next bootstrap scripts/styles; a nonce/hashing policy would require a separately verified rendering change. Deployment TLS/proxy/backup/provider behavior is not proven by local configuration tests. Passing tests is not an independent penetration test.

## Production setup

Use HTTPS at the browser edge. Set production, an exact non-empty list of HTTPS origins without paths/wildcards/credentials, and certificate-verified SMTP. Forward headers only from the actual trusted proxy addresses, never `*`. Overwrite untrusted forwarded headers at that proxy. The API refuses plain HTTP; local health probes must use a trusted internal configuration or TLS. Local `/docs` and generated OpenAPI remain useful; public production docs are disabled, while checked-in generated contracts remain versioned.

Use a migration owner only for migration/seed administration; give the API a different login with no superuser/CREATEDB/CREATEROLE/replication/bypass-RLS, ownership, CREATE privilege or role memberships. Grant CONNECT to the chosen DB, USAGE on the application schema, and SELECT/INSERT/UPDATE/DELETE only on application tables; exclude writes to alembic_version. Refresh grants after new migrations. Do not give migration secrets to the API process. CHORD_DATABASE_URL_UNPOOLED belongs in migration jobs, while CHORD_DATABASE_URL is the limited runtime URL. Startup verifies the runtime role. The development loopback Compose owner exists to provision local schema; it is not a production credential template.

All API responses are no-store. Frontend/API security headers restrict framing, MIME sniffing and referrers. Production CSP excludes eval/external sources while supporting the installed Next bootstrap; the microphone permission policy remains self-only. No cross-origin app/API deployment is selected. Configure a separate deliberate CORS policy only if architecture actually changes.

## Dependency and provider review — 2026-11-11

`npm run security:audit` performs both runtime/full audits, writes ignored evidence and rejects all runtime, unknown, high/critical or expired findings. Current full findings are nine moderate entries from one [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249); only dev-marked lock nodes with that advisory graph are accepted until 2026-12-11. Patch trials were restored because dependency validity failed. No forced downgrade or invalid patched tree is shipped. Resolve compatible upstream lint dependencies before the exception expires; do not run this toolchain on untrusted configurations. The Python scan uses pip-audit 2.10.1 against all 47 fully pinned packages with no finding observed. Scans depend on advisory services and fail closed on missing/incomplete results. See the report for actual final runs; do not interpret the development exception as a clean full scan.

The app embeds no remote font, advertising, tracking or content API during practice. Browsing a provenance link is an explicit user action with referrer suppressed; the destination can still see normal network/browser information under its own policy. [MusicBrainz licensing](https://musicbrainz.org/doc/About/Data_License) distinguishes core CC0 metadata from supplementary data and documentation; none grants popular lyrics/recordings. Its [privacy policy](https://metabrainz.org/privacy) describes IP/User-Agent/access logs and possible third-party content when visiting its site. The bundled popular identities use recorded core-metadata provenance, not a runtime request containing user history. [Wikidata licensing](https://www.wikidata.org/wiki/Wikidata:Licensing) covers structured data; linked [Wikimedia privacy](https://foundation.wikimedia.org/wiki/Policy:Privacy_policy) applies on its sites. No new scraping/import permission is inferred.

[npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) submits package names/versions to the registry, not personal practice records. Python advisory checks similarly use dependency identities. GitHub CI receives committed code and synthetic-test evidence only; private env/mail/DB/export artifacts are excluded from uploads. Actual hosting, database, SMTP and backup providers are unselected deployment gates; review their region, access, retention, terms and contact details before public operation. No generic provider approval is claimed.

## Accessibility evidence and limits

See security.spec.ts and existing auth/tuner/chord/metronome/pattern/song/practice/progress/training journeys. New coverage checks account controls at 375/768/1280 pixels, WCAG-tagged axe scans, no horizontal overflow, native invalid-confirmation focus, file download, success/error feedback and deletion isolation. The second journey visits tuner/chords/metronome/patterns/songs/practice/progress/training/reports/privacy with reduced motion, keyboard skip-to-main, accessible headings/tree content, exact navigation and no off-site requests. Existing SVG titles, note/cents/status text, count labels and keyboard-select controls supply text alternatives. No color-only result or drag-only confirmation is introduced. Sensitive auth forms use POST; passwords can be pasted/autofilled without puzzles or memory tests.

This is executed semantic/keyboard/automated evidence, not certification or a completed live NVDA/VoiceOver test. The final screenshot is reviewed separately. Device-specific speaker/microphone behavior and earlier low-string tuner checks remain separate from this phase.
