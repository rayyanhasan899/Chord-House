# Strumming patterns

Sign in and open `/patterns`. Twelve original one-bar exercises cover 2/4, 3/4, 4/4 and 6/8, beginner/intermediate/advanced and several practice styles. Filter by name/guidance, meter, level, style, suggested BPM or favorites. Open an exercise to read its provenance, counts, notation and guidance. Saving a shared exercise creates your private copy. Your saved patterns can be edited/deleted; favorites persist per account. New private pattern starts a clean draft.

Each counted beat divides into 1, 2 or 4 equal steps. Quarter meters use quarter-note BPM; 6/8 uses eighth-note BPM. Sixteenth counts read 1 e & a; arrows identify direction, rest is silent, mute is a short low synthetic tone. Grid selectors are keyboard-accessible and the current step has an outline plus textual count. Resizing meter/subdivision preserves matching positions and fills added positions with rests; inspect the rhythm before saving.

Choose playback BPM 30–300, a library chord for guitar/bass/ukulele, volume, loop, accents and optional synchronized metronome. 6/8 accents counts 1 and 4; other meters accent count 1. Down/up reverse synthesized string order. Turning loop off plays one measure and releases audio after its tail. Any pattern/playback setting change stops audio; press Play again. Stop/navigation releases queued sound. Background throttling, sleep and long stalls may interrupt; missed steps are skipped and suspension requires restart. No microphone, audio upload or paid service.

`catalog/pattern_domain.py` is independent rhythm/publication logic. `patterns.py` holds DTOs, SQL adapters and application operations; `pattern_routes.py` composes authenticated routes. Migration 0007 introduces strumming_patterns and pattern_favorites with FK cascades, unique owner/target favorites, indexes and visibility/metadata constraints. Server scope always includes private owner; manager routes include shared scope only. Accounts cannot assign owner/status via private DTOs. Shared archive preserves history/favorites, private delete cascades favorites, account delete cascades private rows and that account's favorites. No private-to-public sharing exists.

API (cookie session; mutations require Origin and CSRF):

| Method/path | Purpose |
|---|---|
| GET /api/v1/patterns?offset=0&limit=100 | Published shared plus own private, with own favorite flag; bounded pagination |
| POST /api/v1/patterns | Create private PatternInput |
| PUT/DELETE /api/v1/patterns/{id} | Update/delete own private pattern |
| PUT/DELETE /api/v1/patterns/{id}/favorite | Idempotent add/remove favorite for visible pattern |
| GET/POST /api/v1/managed-patterns | Content manager/admin list all shared states or create shared draft |
| PUT /api/v1/managed-patterns/{id} | Update metadata and set draft/published/archived; publication gate required |
| DELETE /api/v1/managed-patterns/{id} | Archive shared record |

Use `/docs` on the API server for generated request schemas. SharedPatternInput extends PatternInput with status, reviewed, rights_statement and attribution. An authorized manager can unpublish by PUT with status draft, publish with reviewed=true plus adequate rights statement and attribution, or archive. Role provisioning remains the existing operator-controlled database process; no user can promote themselves. Full manager browser UI follows in Phase 15. A rights statement is an operator attestation, not automatic legal clearance; verify external grants before publishing third-party exercises.

Seeds are authored mathematical practice exercises, not copied charts or song patterns. `python -m app.modules.catalog.seeds` is explicit, idempotent and does not reset edits/unpublication. No new credentials/services are needed. Frontend filters run over all paginated accessible results; a future measured scale requirement may move them server-side. Audio runs locally through `lib/audio/transport.ts`, shared with metronome. Tests separate beat math, native browser scheduling and physical sound; speaker/ergonomic certification is not claimed.
