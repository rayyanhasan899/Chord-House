# Private song storage: operator and recovery guide

Run from the Phase 19 `backend` directory. Keep the accepted Phase 18 preview
running until all release gates pass. Never copy the old root application over
the reconciled implementation. Local mode works with no cloud SDK or credentials.

## Setup and folder workflow

Install the normal locked backend dependencies, then the optional cloud SDK:

```sh
python -m pip install -r requirements-dev.lock -r requirements-cloud.txt
python -m alembic upgrade head
python -m app.modules.catalog.cloud_catalog scan --root /path/to/songs
python -m app.modules.catalog.cloud_catalog dry-run --root /path/to/songs --rights /private/rights.json
python -m app.modules.catalog.cloud_catalog sync --root /path/to/songs --rights /private/rights.json
python -m app.modules.catalog.cloud_catalog status
python -m app.modules.catalog.cloud_catalog resume --root /path/to/songs --rights /private/rights.json
```

The unchanged layout is `English songs`, `Urdu songs`, or `Hindi songs`, then one
title folder containing `audio.mp3`, `lyrics.txt`, or both. Optional metadata is
not required to create stable identities. Scan reports hashes/sizes/diagnostics,
never song text. New identities reuse Phase 18's trusted local importer; an active
object mapping is preserved when local sync runs. Catalogue GET never uploads.

Only the trusted host operator has these commands and write credentials. There
is no web upload endpoint. Ordinary signed-in accounts retain shared reading,
while favorites and other personal resources remain private.

The operator environment needs `CHORD_DATABASE_URL`, `CHORD_OBJECT_BUCKET`,
`AWS_ENDPOINT_URL_S3` (HTTPS), `AWS_REGION`, `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY`. Use a separate read-only storage credential in the API.
Never put these variables in NEXT_PUBLIC variables, frontend files, Git or logs.
Example variable names are in `backend/.env.example`.

A rights manifest is separate from ordinary song metadata. For each approved
folder it records the actual source/evidence and the exact file checksums:

```json
{
  "English songs/An original composition": {
    "source": "Actual author or licensed source reference",
    "evidence": "Actual authorization covering recording and text distribution",
    "sha256": {
      "audio.mp3": "REPLACE_WITH_ACTUAL_SCAN_SHA256",
      "lyrics.txt": "REPLACE_WITH_ACTUAL_SCAN_SHA256"
    }
  }
}
```

This is an example shape, not a license. Missing/changed checksums or absent
source/evidence produce `blocked_rights`, with no upload for those files.
Do not fill the manifest with guessed attestations. Possession of the supplied
collection and the historical hard-coded permission assertion establish no
distribution right. Originals remain available in the existing local workflow.

## Cutover, retry, rename and withdrawal

Take a verified matched backup before sync. Source files are read, never moved
or deleted. Uploads use immutable `songs/UUID/fingerprint/name` keys. Each object
is downloaded again and independently checked for exact size and SHA-256 before
the database transaction updates active references. ETag and uploaded hash
metadata alone are insufficient proof. The previous mapping, provenance,
fingerprint and state remain in `song_imports`; audit events record cutover.
The existing schema supports this journal, so no new Alembic migration is needed.

An interruption can leave staged objects; rerun `resume` with the same source and
manifest to verify/reuse them. Failed verification leaves the active mapping
unchanged. Concurrent mapping changes cause a conflict rather than overwriting
another operator. Unchanged imports do not increment the revision or duplicate
the song. The runtime uses private HEAD and GET/Range, bounded 64 KiB reads and
closes the provider body on cancellation. Expired/revoked sessions are denied on
every new request; ongoing downloads recheck sessions at five-second intervals.
Bytes already delivered or browser-buffered cannot be recalled.

```sh
python -m app.modules.catalog.cloud_catalog rollback --job JOB_UUID
python -m app.modules.catalog.cloud_catalog cleanup --job FAILED_OR_STAGED_JOB_UUID
python -m app.modules.catalog.local_catalog rename --root /path/to/songs --song-id SONG_UUID --to "Urdu songs/New title"
```

Rollback refuses to overwrite a subsequent mapping. Explicit cleanup only accepts
failed/staged jobs and refuses objects retained by active or historical rollback
mappings. Neither operation removes local originals. Rename uses the existing
stable-ID mapping command; then scan/sync the new path. A missing local folder
never deletes a remote song. Intentional withdrawal uses the existing authorized
managed-song withdrawal API. Deleting a listener must never delete shared assets.

## Paired backup and restore

Install matching PostgreSQL `pg_dump`/`pg_restore` tools. Use the direct owner URL
only in the operator process. The dump and selected active media mappings share
one exported repeatable-read snapshot. Each copied object is hashed; a versioned
manifest is written last. A directory without a manifest is incomplete.

```sh
python -m app.modules.catalog.media_backup create --directory /private/backups/UNIQUE_NEW_DIRECTORY
python -m app.modules.catalog.media_backup verify --directory /private/backups/UNIQUE_NEW_DIRECTORY
```

The backup contains all PostgreSQL shared/private rows and active asset bytes,
not just the song tables. Keep it private; it is not a repository artifact. Freeze
operator imports and shared-content edits while taking/rehearsing backups.
Retain previous immutable cloud revisions separately for full historical rollback;
the manifest copies active objects, not every abandoned or historical revision.

For restore, use a fresh isolated empty PostgreSQL database, a new empty local
song root and a separate private test bucket/branch. Never target production.
Point environment variables at those isolated destinations, then run:

```sh
python -m app.modules.catalog.media_backup restore --directory /private/backups/UNIQUE_NEW_DIRECTORY
```

Restore verifies the bundle first, copies/checks media, then restores database
rows in a single PostgreSQL transaction. An existing public-schema table causes
refusal. Object and database operations are not one ACID transaction. A failed DB
restore may leave copied objects; retain the bundle and retry against an empty
database. Start the isolated app, verify stable IDs/favorites, exact lyric bytes,
two-account sharing, guest denial and private isolation before any production
cutover. This phase has not yet demonstrated that full rehearsal.

## Deployment and acceptance

Use `compose.production.yaml` only on an existing no-cost Docker host and DNS
name. Configure the non-owner runtime database role, read-only object credential,
working SMTP, exact HTTPS origin and Caddy domain. Apply migrations as a separate
controlled owner job. Build images without source songs. Check
`/api/v1/health/live` and `/api/v1/health/ready` through HTTPS; only ingress is
public. Keep the previous image/config and matched backup for version rollback.

Before release run the retained full lint/type/contract/PostgreSQL/migration and
browser gates. Add an ordinary folder, sync twice, replace and explicitly rename,
then test a clean server without source-song mounts. Two signed-in accounts must
play the same object; guest GET/HEAD/lyrics and ordinary-user writes must fail.
Test revocation, provider outage/quotas, seeking/repeat and paired restore.
No live app, source collection migration, or full restore is certified yet.
