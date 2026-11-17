# Song collection import — 13 November 2026

Status: completed and verified through the production API.

Website: https://chord-house.vercel.app/songs (sign-in required).

## Imported collection

| Language | Songs | Audio bytes | Lyrics bytes |
| --- | ---: | ---: | ---: |
| English | 4 | 15,486,512 | 17,873 |
| Hindi | 13 | 57,854,204 | 29,276 |
| Urdu | 7 | 23,770,100 | 11,960 |
| Total | 24 | 97,110,816 | 59,109 |

Source: owner-uploaded songs.zip, SHA256 fd65a9358521937704437f7745e67c6dd69773b0a65acf1a3bf272535767f79e.

All folders contained audio.mp3 and lyrics.txt. The ZIP was checked for unsafe paths/symlinks and size limits, the existing local-storage scan returned no issues, and ffprobe decoded all 24 MP3s. Nine folders reused existing catalogue identities; fifteen new identities were created by the existing deterministic local importer. Existing titles, artists, UUIDs and private user data were preserved.

Publication provenance records the project owner's earlier distribution-permission attestation and the explicit request to import this exact uploaded archive. No independent license document was reviewed or invented. The rights manifest binds that provenance to each exact file hash.

## Recovery and import

Before mutation, a no-compute copy-on-write database/storage branch was created:
before-song-import-20261113 / br-wandering-block-azly7cyy, parent br-sweet-band-az4blfcv, parent LSN 0/1D2CF08. It reached ready state and remains available as the pre-import recovery point. It is not a rehearsed standalone pg_dump/media restore bundle.

The existing scan, planning, stable-ID matching, copy verification and cloud sync implementation was reused. Direct PostgreSQL connections from this workspace were unavailable, so importer state was prepared against an isolated local SQLite model using the same validated seed identities; the resulting reviewed PostgreSQL statements were applied through the authenticated SQL connector. Schema compatibility was checked on staging first.

Production staged 24 import journals and unverified local bindings. All 48 objects were uploaded under immutable songs/UUID/fingerprint/name keys in the existing private bucket. Each was independently downloaded, sized and SHA256-checked; provider metadata alone was not accepted as verification. A single advisory-locked production transaction checked the exact staged snapshots and atomically activated all 24 bindings and journals. There are 24 active media jobs and 24 object/verified bindings.

The original ZIP and extracted files were not changed, moved or deleted. Song bytes and lyric text were not committed to Git. No application-code change or redeployment was needed for the import.

## Verification

- All 48 private objects passed independent upload/download checksum verification.
- An unsigned direct-storage request returned 403.
- Every one of the 24 songs passed a full production-API audio download with exact size and SHA256.
- Every song returned lyrics exactly matching the uploaded UTF-8 text, with the application's existing UTF-8 BOM decoding behavior.
- Every song passed HEAD size checks and exact HTTP 206 bytes=1000-2000 seeking checks.
- The largest MP3, 5,424,236 bytes, streamed successfully through Vercel.
- A second ordinary signed-in account read the same audio and lyrics.
- Guest GET audio, GET lyrics and HEAD audio requests returned 401.
- After logout, media requests returned 401.
- The catalogue endpoint returned HTTP 200.
- Repeating the existing importer against the verified checkpoint returned unchanged for all 24 entries, with no reuploads.
- Browser access confirmed the website's sign-in gate. Browser audio rendering was not separately tested; the media assertions above are deployed HTTP/API checks.
- The two disposable media-check accounts were removed via the application's deletion endpoint; a DB check confirmed zero remaining test accounts and the original one user account retained.
- The temporary storage read/write credential was revoked and its local secret file removed. The production API retains its separate read-only credential.

No paid service or plan was enabled. Email remains intentionally disabled. A full matched backup-restoration rehearsal, provider-failure simulation and production rollback rehearsal remain separate unverified Phase 19 gates.
