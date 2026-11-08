# Phase 09 report

Implemented public /chords: 198 original structured/mathematically transposed voicings for standard acoustic/electric guitar, bass and re-entrant ukulele. Search supports familiar names, enharmonic aliases, qualities and variations. SVG diagrams, accessible editable fretboard, open/muted/fretted positions, suggested fingers/barres, note names, difficulty and guidance. Browser-local triangle-wave synthesis supports volume, arpeggio, stop/replay and automatic context release. No microphone or paid service used.

Private custom chords support create/read/edit/delete with paginated owner-scoped API, CSRF/session checks and domain validation for string count, fret/finger ranges, all-muted shapes, stretch and barre consistency. Migration 0006 and owner cascade preserve privacy. Generated API types updated. Metadata registration fix explicitly registers pre-existing workspace models for standalone Alembic as well as tests.

Verification: 263 Vitest/component tests passed (198 chord-tone/fingering checks plus diagram/search/invalid-shape tests and prior suite). Ruff lint/format and mypy (30 app files) passed. Frontend lint/type checks passed. Complete real PostgreSQL suite: 16 passed with new private-chord CRUD/isolation/invalid-shape assertions. Production build and 5 Chromium tests passed, including private chord save/edit/delete and audio start/stop. No mock authentication. Repeated system run after pagination/domain separation also passed. Contract generation/drift check passed. Exact GitHub results recorded after push.

Provenance: original structured shape definitions plus equal-temperament math; no copied chord-chart artwork, recordings or song arrangements. Pitch classes and fingering constraints automatically validated; ergonomic/difficulty guidance is not expert-reviewed and no professional validation is claimed. Custom chord names are user labels rather than automatic identification. Bass catalogue currently covers major/minor; unavailable qualities produce an honest empty state. Optional easier-alternative recommendation (CHR-020 MAY) is not selected; variations can be compared manually.

Architecture: pure chord validation in catalog/domain.py; transport schemas call it. Persistence/service adapter owns SQL, routes call use cases; JSONB stores fingering arrays, relational ownership FK cascades with account. No public custom sharing. Existing user source files and generated next-env changes preserved, no credentials/mail staged. Sources unchanged.

Usable: /chords as guest for search, diagrams, custom construction and sound; sign in to save/edit/delete private chords. Existing workspace/tuner remain. Physical tuner calibration from Phase 08 is still open; no result invented. Phase 10 is explicitly authorized next and independent of that hardware gate.

Branch codex/phase-09 based on codex/phase-08; no merge. Report commit/push/PR from actual execution. Next: PHASE-10.md.
