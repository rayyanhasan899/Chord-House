# Training, integrated practice and reminders

Sign in and open `/training` (Training in navigation). Guests keep tuner, metronome and public chords; the training hub and private history require an account. Existing account and cookie/CSRF protections apply.

## What to use

- **Transitions:** choose your instrument and at least two published chord names. Set 0.5–30 seconds/change; watch current/next diagrams. Shapes prefer the selected difficulty and lower frets, falling back to the easiest available level if needed. Optional guide chords are synthesized locally after Start. Select random sequences/difficulty if desired. Stop and record your own clean-change count, difficulty, completion and notes; explicitly save a private assessment. Stop/pause/change tools whenever needed. Rounds are bounded to one hour.
- **Chord challenge:** choose chords and a 5–300-second round. The timer ends the round; you report clean changes and explicitly mark completion yourself. Chord House does not listen to or grade your playing.
- **Ear training:** choose note, interval or chord-quality questions and beginner/intermediate/advanced difficulty. Generate a question, play it (or C4 reference), choose an answer and read the explanation. First attempts count once in a page-local score. No audio starts automatically and no recording is uploaded.
- **Note finder:** choose instrument, guitar tuning where applicable, string and fret 0–24. Read pitch/octave/Hz and optionally play a generated tone. Standard bass and re-entrant ukulele are represented correctly; this is not an acoustic accuracy measurement.
- **Section practice:** choose a song with an approved text variant, select inclusive line bounds, 30–200 cue BPM and 1–16 beats/line, then loop or run once. Cues pace reading/strumming; they do not play the song melody/recording or stretch audio. Roman Urdu/Hindi and native scripts retain their language/direction. Original practice texts are available; popular metadata-only entries have no unlicensed lyrics added. Source attribution/license remain visible. Content is rechecked on Start and every 30 seconds; expiry or withdrawal stops playback. Hidden tabs/tool changes stop cues.
- **Routine suggestion:** inspect an explanation and suggested activities based on your instrument, skill, active daily goal and recent saved material. Save explicitly, then edit/start it in Practice. It is deterministic and adds no practice minutes itself.
- **Private assessment history:** view pages of saved self-assessments with profile-timezone dates, instrument and notes; delete your own records. Deleting removes the assessment payload; minimal retry metadata remains until account deletion to prevent accidental resurrection.

Use **Start a linked saved practice session** from training or an approved song. The link pre-fills focus/song only. Start the timer in Practice, use **Use training tools while this timer runs**, return through Practice sessions, End, review and explicitly Save. Only saved active time contributes to totals, daily/weekly goals and streaks. No timer/assessment/suggestion silently grants credit.

## Optional reminders

In Training → Reminders choose weekdays/local time, enable and Save. Times use the current account timezone (change it in Account); reminders default off. In a visible signed-in tab, the app checks every 30 seconds and on focus. A reminder can be delivered from its scheduled minute until just before ten minutes later. There is no late catch-up beyond that window. One reminder is claimed per account/local date across tabs; timezone revisits and repeated DST hours do not duplicate it. Nonexistent DST times are skipped.

Read the explanation before pressing the separate browser-permission button. If you opt into browser notifications and grant permission, a generic notification supplements the in-app reminder. Denied, unavailable or failed browser notifications fall back to the in-app message. Disable and Save to stop reminders. Dismiss closes the current in-app message. Revoking browser permission does not block any tool.

**An open visible app tab is required.** Closed browsers, sleeping devices, background tabs and lost connections do not provide reliable delivery. A server claim prevents duplicates but a crash immediately after claiming can lose the display. No push subscriptions, promotional messages, email reminders or background scheduler are installed. Ear answers, audio and microphone data are not stored by these tools.

## API and data contracts

Authenticated `/api/v1/integration` endpoints:

| Method/path | Behavior |
| --- | --- |
| GET `/assessments?offset=0&limit=50` | Owner-only newest-first list, limit at most 100 |
| POST `/assessments` | Private assessment; stable client UUID retry returns the same record; changed payload/key gives 409, deleted retry gives 410 |
| DELETE `/assessments/{id}` | Clear own payload; another owner's ID is 404 |
| GET `/reminder` | Disabled defaults or own preferences plus current timezone |
| PUT `/reminder` | Full validated preferences with expected version; stale changed writes 409 |
| POST `/reminder/check` | Atomic due claim, never requests browser permission |
| GET `/suggestion` | Explainable unsaved routine DTO; Save uses existing Practice routine endpoint |

Writes require existing session, trusted Origin and X-CSRF-Token. Owner identifiers are never accepted from clients. Responses are no-store. Assessment input forbids extra fields, requires 2–8 valid/distinct chords, supported instrument, bounded positive duration/count/notes and explicit self-report flags. Reminder fields require valid HH:MM, distinct weekdays 0=Monday…6=Sunday and nonnegative version; enabling requires at least one weekday. Weekdays normalize order.

Migration `0012_integration` follows `0011_content`: `training_assessments`, `practice_reminder_preferences`, `practice_reminder_deliveries`. Owner foreign keys cascade on account deletion; assessment keys and delivery dates have uniqueness guarantees. Deleting an assessment preserves only its retry tombstone. Down migration destroys these new records and is tested only on disposable databases; never downgrade personal data casually. No new runtime dependency, paid provider or secret is required by training itself.

OpenAPI and generated TypeScript live in frontend/src/lib/api; `npm run contracts:check` verifies actual app/schema parity. See ADR-0022 and the Phase 16 report for executed tests and limitations.

## Current isolated preview (Phase 17)

The current branch is in `.artifacts/phase17-worktree` because the original checkout contains unfinished song changes. From that checkout, run `npm ci`, then `python scripts/dev-preview.py` with Node 24/npm 11, Python 3.14 and Docker running. Native Python runs only this standard-library launcher; the backend runs in Linux and does not require changing Windows Application Control.

Open **http://127.0.0.3:3002/training** and register a preview account. Use this exact host; normal personal usage is http://127.0.0.1:3000. Cookies are not isolated by port, so do not use the personal hostname for the preview. This current preview leaves the earlier Phase 16 preview unchanged and has its own PostgreSQL volume, API port 8002 and DB port 5435. Existing accounts/private data and unfinished local song-player changes are not copied. Startup builds the locked backend, applies migrations and seeds the reviewed catalog without overwriting edits. First image build needs network; later local operation does not need a content provider.

`.env.preview` contains private generated credentials and is ignored. Keep it with the persistent preview volume; if it is lost while the volume exists, restore the original file. The launcher refuses to invent replacement credentials. Mail/reset codes stay private in the `preview_mail` Docker volume; inspect locally through `docker compose --env-file .env.preview -f compose.preview.yaml exec api ls -t .local-mail` and read only the matching file on your own computer. Do not paste codes or commit mail. API docs: http://127.0.0.1:8002/docs.

`--backend-only` initializes/rebuilds without starting Next. Ctrl+C stops the foreground preview frontend; backend/database persist. Stop them with `docker compose --env-file .env.preview -f compose.preview.yaml stop`. Do not delete volumes. Re-run the launcher after code changes to rebuild. This is a local development preview, not production deployment. The normal launcher remains for a single current checkout; do not point the older Phase 15 checkout at the upgraded preview database.
