# Shared song library: storage and migration plan

Researched 12 November 2026. **Recommendation, not provisioning or migration.**
This planning update uploads nothing and does not select paid billing, a provider
account or region. Recheck published terms and actual account capabilities in
Phase 19. Access/product decisions are in OWNER-SONG-LIBRARY-BASELINE.md.

## Recommended starting point and alternatives

Start by evaluating **Neon Free PostgreSQL plus Neon Object Storage** together.
Its current pricing lists 1 GB database storage, 5 GB object storage and 100 CU-hours
monthly per project, with no credit card required for Free. Current plans document
5 GB monthly public transfer per project, shared by its products. The 24-song,
approximately 93 MiB collection fits its storage allowance, but repeated listening
is limited by transfer well before storage. Object Storage supports S3-style clients
including Python, with only a subset of S3 operations; Phase 19 must verify the
required API/region and real byte-range/HEAD streaming rather than assume parity.
[Pricing](https://neon.com/pricing),
[plan limits](https://neon.com/docs/introduction/plans),
[storage](https://neon.com/docs/storage/overview),
[S3 compatibility](https://neon.com/docs/storage/s3-compatibility).

This is a low-setup, no-card starting recommendation for modest usage, not a promise
of unlimited family music streaming. Do not move existing working authentication
to Neon Auth or replace the FastAPI backend just to use database/file storage.

| Alternative | Current published allowance / consideration | When to consider |
| --- | --- | --- |
| Neon PostgreSQL + Cloudflare R2 Standard media | R2 includes 10 GB-month storage, 1 million Class A and 10 million Class B operations monthly; internet egress is free. R2 activation is a metered subscription, with billable usage beyond allowances. Verify billing/payment requirements and obtain explicit consent for any charges. | Strong media-growth option if playback traffic outgrows a small egress allowance and the owner accepts its billing conditions. Not automatically selected. |
| Supabase Free PostgreSQL + private Storage | 500 MB database, 1 GB file storage, 5 GB egress plus 5 GB cached egress; free projects pause after one inactive week and the plan limits active projects. Retain existing server-cookie authentication. | A viable single-provider alternative for this collection; evaluate pauses, backup features, transport and transfer quotas. |

Sources: [R2 prices](https://developers.cloudflare.com/r2/pricing/),
[R2 activation](https://developers.cloudflare.com/r2/get-started/),
[Supabase pricing](https://supabase.com/pricing),
[private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Use actual total bytes, expected listeners, plays/month, average file size,
repeat/seek traffic, backup copies and request counts to forecast usage. Example:
5 GB / 4 MB is roughly 1,250 full-file transfers before other traffic; this is an
illustrative calculation, not a guaranteed count or policy. Open registration
means traffic is not restricted to a fixed number of relatives. Add limits/alerts
and explicit exhausted-quota behavior; do not silently upgrade a plan. Free storage
does not imply free API/frontend hosting, unlimited bandwidth or included backups.

## Data placement and access

- PostgreSQL: stable song ID, title/artist/language/aliases, optional known learning
  metadata, sharing scope `authenticated_library`, publication/rights status,
  asset/revision references, byte lengths/MIME/SHA-256, import batch/result and audit.
- Private object storage: exact `audio.mp3` and `lyrics.txt` payloads, under keys
  such as `library/<song-id>/<revision>/audio.mp3`. Keep file bytes out of database
  JSON/base64 fields. Prefixes are logical storage keys, not user-controlled paths.
- Preserve existing shared SongReference identity and private Favorite/Collection
  links. Add reviewed asset/import tables or equivalent explicit contracts only
  where needed; use Alembic and genuine account/role checks.
- All signed-in accounts may read the shared library; only authorized operators
  may upload/replace/withdraw it. A listener's account deletion removes that user's
  private records, not shared recordings. No public custom-chord/pattern sharing.
- Backend authentication protects every media path, including HEAD, byte ranges,
  lyrics, direct/deep links, stale assets and withdrawn songs. The browser uses the
  same player with an authorized media URL; no service/S3 credentials or public
  bucket URLs. Validate 200/206/416, content types/length/ranges, cancellation,
  bounded streaming, seeking and logout/withdrawal behavior on the real provider.
- Keep storage, provider SDKs and HTTP in infrastructure adapters; application
  services coordinate import/read; domain rules stay framework/ORM independent.
  Local mode uses the existing song directory and remains usable without cloud.

## Import and migration procedure for Phase 19

1. Confirm the reconciled Phase 18 baseline and passing gates. Inventory current
   folders, files, exact byte hashes, song IDs, private links and total storage.
   Back up database and source files separately before changes.
2. Provide an operator CLI and/or protected management action with scan/dry-run,
   validation, explicit sync/apply, per-file results and resume support. Ordinary
   song GET requests and any newly registered user must not trigger cloud uploads.
3. Keep folder creation simple: add `audio.mp3`, `lyrics.txt` or both. Parent folder
   selects language; child folder supplies a title. Optional `song.json`/generated
   manifest carries stable ID and artist. Do not demand hand-written sidecars for
   existing folders or invent missing metadata. Document the actual implemented
   command, not a fictional command assumed already available.
4. Validate encoding/type/size/path containment/symlinks/collisions. Preserve UTF-8
   lyric bytes and visible spacing; do not upload HTML, execute lyric text or fetch
   arbitrary URLs. Record source/permission status truthfully per component.
5. Upload **copies** to versioned private keys. Compare byte counts and hashes after
   retrieval; S3 ETag alone is not a universal checksum. Resume interrupted imports,
   skip unchanged hashes and detect same-ID edits. Do not duplicate songs on retry.
6. Commit active asset references only after that revision's required uploads are
   verified. Object writes and SQL are not one distributed ACID transaction: use
   staged batches/reconciliation and a reviewed orphan-cleanup policy. A failed
   batch must not replace working player URLs or erase the previous revision.
7. Dry-run must describe adds/replacements/conflicts/removals before applying.
   Folder rename/replacement preserves IDs when mapping exists. Missing local
   folders or cloud outages are not implicit remote-delete instructions. Make
   remove/withdraw explicit and keep private favorite/history references intact.
8. Test playback/lyrics using two unrelated signed-in accounts and guest denials.
   Then switch online retrieval to stored references and verify it from a device
   with no local `songs/` mount. Online use must not depend on the owner's computer
   staying online or hosting a tunnel. Compare exact retrieved text/hashes, seek,
   repeat, volume, buffering and failure recovery.
9. Keep local source files and a working local configuration. Rehearse rollback to
   the prior metadata/asset revision. Removing originals is a separate destructive
   action requiring an explicit later request, not part of migration success.
10. Back up both DB and objects, including the mapping/manifest/permissions. Restore
    into an isolated environment and prove player URLs, formatted lyrics, IDs,
    favorites and private-user isolation survive. Do not assume a database backup
    or provider branching/PITR automatically restores deleted recordings.

## What changes in the last three phases

- **18:** reconcile the owner's accepted source baseline, preserve the player and
  exact folder/text behavior, implement/validate portable local storage contracts,
  and close prior quality failures with focused diagnosis before final regression.
- **19:** implement the selected online storage adapter, safe batch migration,
  incremental folder sync, local/cloud configuration, deployment and restore.
- **20:** audit the original SRS plus CHG-SONG-001–012; independently demonstrate
  fresh-machine shared playback and a complete new-song folder-to-online workflow.

## Remaining real decisions and gates

No audience or registration question remains: all signed-in users share songs and
registration is open. Provider/account/region and any billable activation remain
Phase 19 choices after console/pricing/traffic review. Recording/lyric distribution
rights are not established by possession of files or the current importer text;
resolve and record actual permission before external publication. No provider can
supply that permission or guarantee legal availability of a popular-song catalog.
No cloud storage, upload, public link, payment method or deployment was created by
this planning revision.
