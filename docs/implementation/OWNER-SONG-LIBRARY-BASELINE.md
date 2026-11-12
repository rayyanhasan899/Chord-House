# Accepted song library and player baseline — 12 November 2026

This amendment records the owner's latest instructions and governs the revised
Phase 18–20 prompts. It changes the plan; it does not claim deployment or new
test results. Previous phase reports remain historical evidence.

## Accepted decisions

- Preserve the owner's preferred updated application, referred to as Phase 17,
  including the supplied song collection, recorded-music player and lyric layout.
- The application is intended for friends and family. **Registration stays open**,
  by explicit owner reply. Every signed-in account may browse/read/play the same
  shared collection; this therefore includes anyone who registers. No invitation,
  approval queue or owner-only song-reading restriction is selected.
- Guests retain tuner/metronome/public chords, but cannot fetch song lyrics,
  recordings or song details through unauthenticated media URLs.
- Shared-song ingestion/replacement/removal remains an owner/operator or existing
  authorized catalog-manager action. Open registration does not grant upload,
  moderation, storage credentials or administrative permissions.
- Favorites, collections, notes, practice, goals, progress, custom chords and
  custom patterns remain private to their owners. Shared reference songs are not
  deleted when a listener deletes an account or removes a favorite.
- Local operation remains supported. Online migration must preserve the simple
  folder workflow, exact supplied text and player behavior; it is not permission
  to delete the originals or replace the library with metadata-only samples.

## Locate the real baseline before implementation

At inspection the original checkout is on `codex/phase-15`, with uncommitted and
untracked owner-approved song changes. The separate `codex/phase-17` worktree and
the earlier partial `codex/phase-18` branch do **not** contain those song changes.
Version labels alone cannot identify the accepted product baseline.

Inspect and preserve these actual source files before choosing a base:

- `backend/app/modules/catalog/local_songs.py`, `local_catalog.py`, `songs.py`,
  `song_routes.py`, `song_schemas.py`, core configuration and workspace routes.
- `frontend/src/features/songs/song-player.tsx`, `song-detail.tsx`, `song-list.tsx`,
  the song-related styles in `frontend/src/app/globals.css` and generated contracts.
- Their local-song/player/API/browser tests and `songs/README.md`.
- Successful Phase 17 authentication/privacy/account lifecycle and earlier
  practice/training behavior in their recorded branches.

Phase 18 must reconcile these into one isolated, reviewable source baseline.
Prepare a file/change manifest and compare behavior; do not blindly cherry-pick
whole files, overwrite the dirty checkout, remove security fixes or silently
discard owner-approved work as unrelated. Keep media/private configuration outside
Git, test uploads and CI artifacts. Reuse earlier Phase 18 fixes only after a
focused comparison against this baseline. Its 80/86 result does not validate the
updated player, folder imports or future cloud migration.

## Actual song-folder contract

```text
songs/
  English songs/
    My song/
      audio.mp3
      lyrics.txt
  Urdu songs/
    My Urdu song/
      audio.mp3
      lyrics.txt
  Hindi songs/
    My Hindi song/
      audio.mp3
      lyrics.txt
```

Current inspection: **24 audio/lyrics pairs** — English 4, Urdu 7, Hindi 13;
audio approximately **92.61 MiB**, largest file approximately **5.17 MiB**.
This is a dated inventory, not a maximum catalog size or a content license.

Keep one song per folder, title from its folder and language from its parent.
Either a valid nonempty `audio.mp3` or a readable nonblank `lyrics.txt` is enough
to create an eligible entry. Show honest audio-only/text-only availability.
Hide entries with neither usable file, but retain stable database identities and
private links; an unavailable storage service must not be mistaken for deletion.
Case/spacing normalization remains compatible with current discovery. Detect
ambiguous duplicate titles; do not silently merge different songs/artists.

`lyrics.txt` is supplied UTF-8, optionally BOM-prefixed. Preserve original bytes
for storage/checksums and preserve visible line breaks, blank lines, indentation,
spaces, chord/capo notes and section headings. Render safely as text with the
current monospace/preformatted presentation, including Roman Urdu/Hindi. Do not
replace it with generated lyrics, HTML, structured line arrays or timestamped
lyrics. Current text is **not timestamp-synchronized** and plain chord notes are
**not automatically transposable**. Approved structured arrangements remain a
separate feature; do not invent chords, artist, difficulty, tuning or capo data.

Existing folders remain sufficient. An optional `song.json` or operator-managed
manifest may add artist and a stable song ID; the importer should generate/persist
IDs where needed rather than require hand-authored JSON for every new song.
Support stable-ID continuity across replacement/rename/migration. Ambiguous legacy
title matches require explicit mapping, never deletion/recreation of favorites.

## Player behavior to preserve and verify

Preserve the recorded-audio listening-room design, responsive light/dark styles,
play/pause, duration/current position, seeking, ±10-second controls, repeat, volume,
metadata preload, buffering, end and recoverable error states. Do not replace the
player with synthesized chord playback, a generic demo or unrequested redesign.
Keep safe keyboard labels and responsive controls. Verify navigation/logout/revoke
cleanup, failed/autoplay-blocked playback, cancelled starts and retry behavior.
Do not claim playback-speed controls, waveform, timestamp highlighting, A–B loop
or automatic chord extraction unless separately requested and implemented.

## Online architecture and rights

Use PostgreSQL for song identities, metadata, permission/source records, asset
references/revisions and private learning links. Use private **object storage** for
MP3s and exact lyric files, not binary/base64 payloads in relational rows, Git,
container images or a public frontend directory. A local filesystem adapter and
an online adapter implement the same media-storage contract. See
[the storage plan](SONG-LIBRARY-STORAGE-PLAN.md).

All authorized signed-in listeners share approved library assets. Backend cookie
sessions authorize media/lyrics requests, including ranges, independently of
unguessable IDs. Storage credentials never reach the browser. Prefer authenticated
streaming to keep copied media URLs from becoming guest access. Any signed-URL
alternative needs an explicit expiry/revocation decision and tests.

File possession, a small intended audience or registration are not proof of
permission to redistribute recordings, lyrics or arrangements. Current import
code/README contain an automatic assertion that publication permission was
confirmed; the available conversation does not establish that permission.
Phase 18 must record the actual source/attestation status honestly; Phase 19 must
resolve hosting/distribution permissions for externally served assets. Do not
fabricate approvals, scrape replacements or delete supplied content to conceal
this gap. Technical import, local preservation and rights assessment are distinct.
Where permission cannot be established, explain the affected online-release
limitation and practical licensed/original/public-domain alternatives.

## Added requirement IDs and phase ownership

These supplement the original 450 SRS IDs; they do not renumber or erase them.

| ID | Requirement | Implementation / verification |
| --- | --- | --- |
| CHG-SONG-001 | Open registration; shared song read/play for all signed-in users; guests denied | 18 baseline/auth tests; 19 hosted checks; 20 audit |
| CHG-SONG-002 | Operator/manager-only shared asset changes; personal records remain private | 18 authorization; 19 ingestion; 20 audit |
| CHG-SONG-003 | Preserve language folders and audio-only/text-only/both-file discovery | 18 local import; 19 cloud sync; 20 new-song walkthrough |
| CHG-SONG-004 | Exact lyric format and safe English/Urdu/Hindi/Roman text presentation | 18 byte/layout tests; 19 round trip; 20 acceptance |
| CHG-SONG-005 | Existing music-player controls, design and lifecycle parity | 18 browser tests; 19 remote-media tests; 20 acceptance |
| CHG-SONG-006 | Stable identities, revisions and private references across rename/replacement | 18 mapping design/local tests; 19 migration; 20 restore audit |
| CHG-SONG-007 | Local/online storage adapters, protected range streaming and correct availability | 18 contract/local adapter; 19 live cloud adapter; 20 portability |
| CHG-SONG-008 | Idempotent, validated, incremental folder-to-cloud imports | 18 manifest/validation; 19 real sync; 20 operator walkthrough |
| CHG-SONG-009 | Verified upload-copy, explicit cutover and rollback without deleting source files | 19 implementation/rehearsal; 20 acceptance |
| CHG-SONG-010 | Truthful rights/source status, protected credentials and free-tier budgets | 18 source review; 19 provider/publishing checks; 20 release gate |
| CHG-SONG-011 | Matched metadata/media backups and tested restore/deletion behavior | 19 rehearsal; 20 independent acceptance |
| CHG-SONG-012 | Simple documented add/replace/remove song workflow and honest release status | 18 instructions; 19 actual commands; 20 user/admin handover |
