# Chord House Vercel deployment

Verified: 13 November 2026 (Asia/Karachi).

## Live application

- Canonical URL: https://chord-house.vercel.app/
- Alternate URL: https://chord-house-raan899.vercel.app/
- Vercel team: RAAN899 (raan-899)
- Project: chord-house / prj_ragGRtHN8vFWr2Q8EKvgqCefE113
- Production deployment: dpl_2PUyMagcmK5PDmcVqv2xySsVy3vo
- Deployed application commit: 7cdc1658602f935c86c66f17d40352a22f4c97ba
- Deployment branch: codex/phase-19-deployment
- Deployment PR: https://github.com/rayyanhasan899/Chord-House/pull/21

Next.js frontend and Python 3.14 FastAPI API deploy together using Vercel Services (beta), with /api/v1 traffic routed to the backend. Neon provides the existing separate Chord House database and private object storage. Vercel Hobby and Neon Free were retained; no paid plan, Render service, domain purchase or paid add-on was enabled.

## Configuration

Server-only credentials are held in encrypted Vercel environment variables; none are committed. Production and preview use separate database branches and restricted chord_runtime roles. Runtime-role checks confirmed no role memberships, schema/database CREATE permission, superuser, database/role creation, replication or RLS bypass privileges.

CHORD_ENVIRONMENT=production
CHORD_EMAIL_ENABLED=false
CHORD_TRUSTED_ORIGINS contains the exact two public HTTPS origins above.
CHORD_DATABASE_URL uses postgresql+psycopg and the restricted runtime role.
CHORD_OBJECT_BUCKET and AWS_* configure the private bucket using storage:read scope.

Production migrations were generated from the repository's Alembic revisions, first applied transactionally on staging and checked, then applied to the empty production database. Schema version: 0013_song_assets. Existing reference seed definitions were imported without overwriting existing rows: 210 reference entries (including instruments/tunings/chords), 12 strumming exercises, 91 song catalogue entries. These catalogue entries do not imply that the owner's laptop recordings were uploaded.

Neon's pooler rejects statement_timeout in startup options. The API now sets SET LOCAL statement_timeout = '3s' at each SQLAlchemy transaction start. In-process periodic cleanup is disabled on Vercel, where execution can stop between requests; cold-start cleanup and per-request session-expiry enforcement remain.

## Email-disabled behavior

New accounts can register and log in, and remain email_verified=false. The registration response states that verification is unavailable. Verification-code and recovery-code requests return a consistent HTTP 503 email_unavailable response. No delivery is claimed, codes are not captured to local files, and verification is not bypassed. Account actions requiring verified email retain that requirement.

To enable email later, configure real server-only SMTP settings, restore CHORD_EMAIL_ENABLED=true, and deploy and test delivery, verification and recovery.

## Verification evidence

- 117 backend tests passed; 22 database-dependent tests skipped locally because direct PostgreSQL network access was unavailable.
- Strict mypy passed for 84 application files; Ruff checks and formatting passed on changed source.
- Next.js production build and TypeScript compilation succeeded on Vercel.
- Staging and production readiness returned HTTP 200 through the deployed API.
- Public homepage loaded in the browser at the canonical URL.
- Public chord search returned 15 matching voicings for C, proving UI-to-API-to-seeded-data rendering.
- Two temporary production accounts registered, logged in with Secure/HttpOnly/__Host session cookies and remained unverified.
- A private task was hidden from the second account; cross-account deletion returned 404; owner deletion succeeded.
- Guests received 401 for account and song endpoints.
- Recovery returned 503 consistently for existing and absent account emails.
- Logout revoked sessions.
- Temporary fixture accounts were marked verified solely to exercise authenticated account deletion; both were then deleted through the application's deletion endpoint. A database check confirmed zero remaining fixture accounts and zero sessions.
- Latest production runtime error/fatal log scan returned no records.

Preview deployment protection remains enabled. Automatic approval review rejected disabling SSO and generating an automation bypass secret; neither change was applied. Authenticated Vercel fetches and ordinary public production requests were used instead.

## Limits and remaining Phase 19 gates

The application is deployed, but this does not certify every Phase 19 exit gate. The owner's 24-song MP3/lyrics collection was imported and verified through production on 13 November 2026. Full-file checksums, exact lyrics, byte ranges, two-account sharing and guest/logout denial passed. See SONG-IMPORT-2026-11-13.md. A production rollback rehearsal, provider-failure simulation and matched database/media backup restoration remain unverified. Email delivery is intentionally excluded by the owner's deployment instruction. The full historical cross-browser suite is not claimed as passing by this deployment.

Git integration is connected, so branch updates can create preview builds. For production changes, create a production-target build, verify it with its production environment, then explicitly promote that deployment. Do not promote a preview expecting unchanged environment variables. Keep production deployment IDs for rollback and take a matched private database/media backup before collection import.
