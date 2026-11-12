# Local song files and stable asset bindings

Phase 18 preserves the accepted listening-room player and exact supplied lyrics. The application interface is English; the shared catalogue supports English, Urdu, Hindi and Roman text. Open registration remains enabled. All signed-in accounts read the same available songs; guests cannot fetch details, lyrics, GET audio or HEAD/ranges. Shared changes require a trusted host operator or existing authorized content manager. Personal favorites and collections remain private.

During this isolated execution, run backend commands in `D:/RAYYAN/Projects/Chord-House/.artifacts/phase18-revised-worktree/backend` with the actual original songs path. The original checkout remains preserved; after merging the reviewed changes, use the normal project backend directory. The running preview-container commands below already target the correct read-only source.

## Add or update songs

Use one folder per song beneath `songs/English songs`, `songs/Urdu songs` or `songs/Hindi songs`. Put `audio.mp3`, `lyrics.txt`, or both inside. No hand-written JSON is required. Text must be nonblank UTF-8 (optional BOM); original CRLF/LF, tabs, indentation and blank lines are retained. Audio has a 100 MiB limit; lyrics have a 400,000-byte limit. Header validation does not certify complete MP3 decoding; the player reports decoding failures. Unsupported files are diagnosed and ignored; unsafe links, normalized-title collisions and invalid supported assets prevent that folder being imported.

From the backend directory with the existing operator database environment configured:

```sh
python -m alembic upgrade head
python -m app.modules.catalog.local_catalog scan --root ../songs
python -m app.modules.catalog.local_catalog sync --root ../songs
```

`scan` is a database-free dry run containing file sizes/checksums and diagnostics, never lyric contents. `sync` is idempotent: it reports added/updated/unchanged bindings and increments an asset revision only on change. Neither command uploads files. Catalogue GET requests never import or mutate songs. Repeat sync after editing files; unsynchronized changes are unavailable until their new checksum is accepted.

For this isolated Windows checkout use the actual original songs path as `--root`, or the read-only `/songs` mount in the preview container:

```sh
docker exec chord-house-preview-api-1 python -m app.modules.catalog.local_catalog scan --root /songs
docker exec chord-house-preview-api-1 python -m app.modules.catalog.local_catalog sync --root /songs
```

For a rename, first identify the existing song UUID, rename the source folder yourself, scan the destination, and map it explicitly:

```sh
python -m app.modules.catalog.local_catalog rename --root ../songs --song-id SONG_UUID --to "Urdu songs/New title"
```

This updates location/title without changing song identity, known artist or private references. Possible renames of missing sources with matching checksums are diagnosed rather than silently imported as new songs. Ambiguous catalogue titles require operator correction; they are never guessed.

Removing a folder or an unavailable disk hides inaccessible media without deleting database identities, favorites or collections. Restore the folder to restore its binding. Intentional withdrawal uses the existing authorized catalogue metadata-withdrawal/archive controls; do not delete song records to remove a recording. There is no guest upload API and no public sharing for user-created chords or patterns.

## Architecture and operation

Migration `0013_song_assets` adds `song_asset_bindings`: stable song foreign key, source kind/key, active revision, per-file checksum/size/type/key and truthful rights status. No recording or raw lyric bytes enter PostgreSQL. The application storage protocol is independent of HTTP/ORM; the local adapter bounds reads to 64 KiB and checks containment, links, size and text encoding. Authenticated routes validate active file checksums, then stream GET/HEAD/ranges with private/no-store, 206/416 and accurate length/content-range. Cancellation closes the stream iterator. A request-scoped asset check cache avoids re-hashing the same shared file repeatedly; it is never a cross-request content or rights cache.

Metadata listing retains the Phase 18 lightweight grant projection and joins asset bindings once, avoiding one database request per candidate. The 5,000-record benchmark deliberately shares one original lyric fixture, and is not a measurement of 5,000 distinct audio files or public network streaming.

Local files remain on the operator device; the preview mounts them read-only. Preserve matched metadata backups and source files before changing a binding. Database downgrade removes bindings only, not source media or stable song references. The preview snapshot before migration is stored locally, excluded from Git. Existing sessions/accounts are retained.

Imported media rights start `unverified`. Legacy hard-coded publication assertions are corrected for local records; this does not acquire permission. Development/local playback is preserved, while production media routes refuse unverified distribution. Verified cloud storage, copy/checksum/cutover, provider billing/regions, and matched online backup/restore remain Phase 19 work. Never commit source recordings, lyrics, credentials or database dumps.
