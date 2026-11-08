# Song discovery and learning

Sign in and open `/songs`. Search title, artist or Roman/native title aliases; filter language, artist, genre where assigned, difficulty/instrument when an approved arrangement has that information, or content availability. Results use bounded server pagination, stable ordering and real counts. Empty/error/loading states and retry controls are available. Every entry has `/songs/{id}` with artist/language, version context, provenance, content availability and private save controls.

Current bundled coverage is 91 song entries. Popular catalog: 30 English, 26 Urdu, 29 Hindi identities with verified MusicBrainz source IDs. These are metadata-only: no popular lyrics, charts, capo, tuning or difficulty is invented. Version-specific titles/credits and disambiguation are retained; some entries are live or alternate versions rather than claimed studio masters. Language and title aliases are editorial classifications; mixed Hindustani/Urdu/Hindi boundaries are not a linguistic certification. Punjabi candidates were excluded rather than mislabeled as Urdu/Hindi. Five unmatched candidates remain explicitly blocked.

Six original chord-and-lyric practice songs (two per language) contain complete original texts, four-chord practice arrangements for guitar, bass and ukulele, counted guidance and source attribution. There are 18 arrangements and eight text variants (English, Roman Urdu/Hindi, one Urdu script and one Hindi script version). No vocal melody, audio recording, expert performance certification or professionally reviewed translation is claimed. Bass versions are chord-tone exercises. Their coverage is tracked separately from the popular catalog; they are not famous songs under new names.

On an approved arrangement choose instrument/version, transpose −12…+12, sharp/flat preference and Reset original key. Root, quality and slash bass are preserved; the source is never changed. Standard/re-entrant compatible diagrams come from the existing validated chord library. Missing qualities/alternate-tuning shapes are labeled unavailable. A root-chord diagram does not guarantee the slash-bass inversion. Capo advice requires standard guitar, a known key and source capo zero; a capo cannot lower pitch. It describes original shapes with a capo versus displayed concert chords without a capo. Unsupported cases explicitly decline a calculation. Text variants retain language/script and direction, chord placements are shown only against their approved matching text, text size is adjustable and simplified view keeps required attribution visible.

Favorite a song, select learning/practicing/comfortable status and optionally one of your private collections. Create a collection on the detail page. Workspace reads the same saved records, supports collection/status filters and title/date sorting, and links back to the song. A song currently belongs to one optional collection per favorite, following the existing workspace model; broader many-to-many playlist membership can be a later extension. Owners are always session-derived, and linked collection IDs are checked. Archived/expired catalog content cannot receive new private links; historical private titles/notes are retained.

## Import and rights workflow

All mutation endpoints require server sessions, allowed Origin and CSRF; content operations require content_manager/admin. Ordinary accounts cannot assign roles or import shared content. Existing operator-controlled role provisioning remains; no account is promoted automatically.

| Endpoint | Behavior |
|---|---|
| GET /api/v1/songs | q/language/artist/difficulty/instrument/genre/availability, offset and limit (1–100) |
| GET /api/v1/songs/{id} | Current approved metadata, arrangements and text variants only |
| POST /api/v1/song-imports | Validate/stage ImportInput; preview ID/state/count/issues; does not publish |
| GET /api/v1/song-imports/{id} | Manager preview |
| POST /api/v1/song-imports/{id}/commit | Atomically publish after rechecking rights, deduplication and staged revisions; idempotent |
| POST /api/v1/managed-songs/{id}/withdraw | Withdraw metadata (entire entry), or named arrangement/text component |

An ImportInput JSON contains a unique key, replace_existing (default false) and up to 200 SongInput items. Stable external keys preserve song IDs. A repeated key with identical content returns the same batch; different content gets 409. Existing sources need explicit replace_existing; duplicate identities under different source keys need review. Stale revisions produce 409; no partial batch remains published. Fix blocked inputs and stage a new key. Source documents are immutable in import payloads; grants must separately cover every supplied component. Publication requires explicit review, adequate evidence, display/cache permission, worldwide territory and unexpired timezone-aware expiry. Transposition permission is separate. An authorized external lyrics link is returned only if the manager explicitly verifies it; none is invented in this pack. No popular-content rights have been acquired by the software.

From backend with the normal environment/API running:

```powershell
.venv/Scripts/python -m app.modules.catalog.song_import_cli --file D:/path/reviewed-import.json
.venv/Scripts/python -m app.modules.catalog.song_import_cli --commit STAGED-IMPORT-UUID
```

The CLI prompts for a manager email/password, keeps cookies/CSRF in memory, stages before commit, prints preview diagnostics and logs out. Passwords are hidden and never command arguments. HTTPS is required except loopback development. Review the complete local JSON and preview issues before committing. No external URL is fetched by the import service. Use the API's `/docs` and generated OpenAPI for exact schemas. Real grants/attribution/terms must be verified before marking review complete; operator attestations are not legal advice or automatic clearance.

`scripts/research-song-metadata.py` is an explicit network research operation, not startup behavior. It writes ignored candidate metadata with rate limiting. `song-metadata-selections.json` records checked identities. `build-popular-song-pack.py` refuses unselected candidates and regenerates the bundled pack/inventory; `build-original-song-pack.py` regenerates the separately authored originals. Shipping JSON is included in wheel package data. Local startup needs no provider account, API key or network after dependencies are installed.

## Rights and expansion limits

[MusicBrainz's database breakdown](https://musicbrainz.org/doc/MusicBrainz_Database) identifies title, artist credit, recording IDs and disambiguation as core data; its [license page](https://musicbrainz.org/doc/About/Data_License) licenses core data under CC0. Tags/ratings/annotations are outside that core grant and are not included. No cover art, lyrics, arrangement or recording grant is inferred from metadata. Research follows the [API rate policy](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting). LRCLIB API availability and Jamendo API access do not establish a verified grant for the requested popular catalog; neither is used as an unreviewed content source.

Prioritize actual rights-cleared chord arrangements and approved provider links for Aadat, Woh Lamhe, Sajni, Doorie, Kuch Is Tarah, Tum Hi Ho, Channa Mereya, Tu Jaane Na, Wonderwall and Perfect. Obtain arrangements and text permissions separately, or original/appropriately licensed contributions. Store the provider's real attribution, caching, territory, expiry and modification terms; publish only when the app can honor them. Link out when permitted rather than copying restricted text. The current catalog is expandable, not a claim of comprehensive popular-song learning coverage. SONG-CONTENT-INVENTORY.json is a bundled snapshot with per-song source/gap backlog; later imports/withdrawals change live coverage and require updated inventory.

Search uses normalized SQL partial matching before bounded streaming projection, filtering and counting current approved components. It keeps output memory bounded but still scans matching documents for exact content/difficulty counts; benchmark and add dedicated search indexes/projections for large future catalogs. No arbitrary total catalog cap is enforced. Song DTOs/validation/publication functions, SQL adapters, versioned import service and composition routes are separate from browser rendering and pure transposition.

Migration 0008 adds song_catalog/song_imports and private favorite uniqueness; duplicate old favorites are preserved as notes rather than discarded. Full downgrade drops the new catalog/import tables; converting duplicates to notes is intentionally not reversed automatically. No production downgrade was performed. Catalog withdrawal does not delete private notes. Imported rights documents may be retained for operator audit; public endpoints omit blocked content. No data export feature is added.

Administrative stage/publish/component-withdraw actions are recorded transactionally in song_audit_events with actor/target IDs, action, component key and UTC time, without content or credentials. System seed has an explicit seed event and null actor. Import history retains full supplied revision/grant documents in manager-only storage; public endpoints do not expose the import store. Full audit browsing/retention policy remains in content-management/privacy phases.
