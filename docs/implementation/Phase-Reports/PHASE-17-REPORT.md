# Phase 17 report — Security, privacy and accessibility

Date: 2026-11-11 (Asia/Karachi). Phase 17 only; Phase 18 has not started.

## Outcome

**Implemented and verified in CI and the local Edge preview:** account data download, confirmed account deletion, complete private-store lifecycle/isolation checks, expired-security/mail cleanup, production HTTPS/host-cookie/runtime-role safeguards, no-store API responses, bounded bodies, redacted errors/logs, credential-free cross-tab private-state clearing, accessible account controls/navigation/focus and dependency-policy scans. All prior learning features remain available in this branch. No new popular-song content/rights, public sharing, external provider or public deployment was added.

**Final tested implementation:** `bbde6aae985c211ef84a3b0e47045922d38def12`. [Push run 42995354280](https://github.com/rayyanhasan899/Chord-House/actions/runs/42995354280) and PR run 42995360747 passed frontend, backend and security jobs. The subsequent evidence/setup documentation commit changes no tested application behavior and skips redundant CI. Earlier complete runs 42959542980 and 42958300308 also passed all three jobs.

Prerequisites: read the phase prompt and relevant source SRS/blueprint, requirements analysis, architecture/database design, assumptions/traceability, Phase 05/06 identity history and the completed Phase 13–16 reports; inspected repository instructions, current branch/status/worktrees/remotes/runtime. Phase 16 prerequisite is complete at d01b8ca with tested code 834adde and run 42875278716. Execution checklist was preserve work; review owner/auth/transport/privacy threats; implement lifecycle and accessibility fixes; execute negative/PostgreSQL/browser/audit gates; document/review/commit/push/PR; stop before 18.

### Executed checks

All commands below exited **0** in final run 42995354280 unless a documented exception is explicitly stated.

| Command / environment | Result |
| --- | --- |
| npm ci, Node 24 / locked Linux installation | Reproducible install; baseline development advisory remains explicit |
| npm run format:check | Passed |
| npm run lint | Passed |
| npm run typecheck | Passed |
| npm test | **420 tests, 9 files passed** |
| npm run build | Production Next build passed |
| npm run contracts:check | Actual FastAPI OpenAPI/client match passed |
| python -m ruff check --config pyproject.toml . ../scripts/dev.py ../scripts/dev-preview.py (backend) | Passed |
| python -m ruff format --config pyproject.toml --check . ../scripts/dev.py ../scripts/dev-preview.py | **108 files** formatted |
| python -m mypy app | **75 source files** passed |
| python -m pytest | **96 passed in 22.78 seconds**, real disposable PostgreSQL 17.9, no skips |
| python tests/browser_system.py | API startup/production build and **17 Chromium journeys passed in 3.3 minutes** |
| npm run security:audit | Runtime findings **0**; full scan **9 moderate dev entries from one advisory**, accepted only by the explicit expiring policy |
| pip-audit 2.10.1 -r backend/requirements-dev.lock --no-deps --disable-pip -f json | **47 pinned packages**, no observed known vulnerability; isolated audit environment |

Local checks additionally passed frontend lint/types/420 unit cases, native pure-Python mypy (75 files), nine applicable new security unit cases, real contract generation/drift and `docker compose -f compose.preview.yaml config --quiet` (disposable placeholder environment, no service start). Native DB-dependent pytest could not load the Windows psycopg binary under Application Control; one earlier local subset showed that unavailable prerequisite and a domain-import violation. The domain violation was corrected to a framework-independent recursive value type; PostgreSQL/role/startup evidence comes from actual Linux checks, not a claimed native pass. SQLAlchemy's installed pure-Python sources were copied to ignored tooling artifacts for contract/static checks; no Windows policy or installed application driver was weakened/changed.

### Observable evidence

The new browser journey downloads a real JSON file, verifies own Unicode/private notes and exclusion of another user's notes, rejects a wrong password, uses native focus/validation for incorrect DELETE, confirms deletion, verifies all owner sessions fail, proves another account survives and confirms a second same-session tab clears its private page. The backend test explicitly populates every owner-linked private store, tests guest/CSRF/extra-owner rejection and cross-owner mutation, verifies cascades/activities/retry keys and anonymized shared actors, and checks shared references/other records survive. A future direct owner table without an explicit export decision fails coverage checks.

Production tests verify HTTP and forged forwarded-scheme rejection, exact-origin constraints, host-only Secure/HttpOnly/SameSite cookie creation and deletion, no CORS allowance, safe body-limit/errors and real limited PostgreSQL role behavior. A separate login can write ordinary app records but cannot create schema objects; superuser/owner/runtime migration-credential configurations are rejected. Tests do not establish real public TLS/proxy or cloud IAM configuration.

Accessibility evidence includes account controls at 375/768/1280 pixels, no horizontal overflow, WCAG-tagged axe scans, native confirmation focus, keyboard skip-to-main, current navigation, accessible headings/tree content and reduced motion across tuner/chords/metronome/patterns/songs/practice/progress/training/reports/privacy. Existing tuner generated-capture journey proves no POST during local processing and Stop/navigation release; denied microphone/notification cases remain usable. This is not live NVDA/VoiceOver testing or independent WCAG certification.

Downloaded and visually inspected **artifact 13843459004**, phase17-privacy-evidence, final synthetic-account **1280×2081** screenshot: export disclosure, private-data explanation, password/confirmation controls, destructive-action wording, visible focus and account layout render without clipping. Artifact **13843388436** holds dependency evidence. No real personal-account export, mail, DB or credentials were uploaded. Existing metronome regression measured 361 clicks and maximum audio-schedule phase error 0.000000000 seconds over three minutes in earlier complete runs; this is not speaker/microphone accuracy.

## Changes and traceability

Security owns pure JSON conversion, ExportSource/ExportSnapshot contracts, explicit SQL projection repository, export coordination/DTO/routes, request limiter and expired-security maintenance. Identity retains authoritative sessions/Argon2/CSRF and now supports host-cookie cleanup, local-mail removal and per-account deletion throttling. Core composition applies production scheme/privilege checks, no-store/error headers and maintenance task lifecycle. No schema change: Alembic head remains `0012_integration`; reviewed existing cascades/SET NULL relationships are exercised on PostgreSQL, including baseline upgrade/downgrade/drift tests.

Frontend adds My account data controls with current password, explicit acknowledgement, typed DELETE, honest feedback, temporary download URLs and POST fallback. Auth identity boundaries remount private views and supported same-origin tabs reload on a generic change signal without broadcasting credentials/profile. Header/nav/main/checkbox/disclosure/focus changes retain text alternatives and reduced motion. CSP/Permissions-Policy allow local audio/microphone use without external script/font/content integrations. Generated OpenAPI/types were produced from the actual app.

| SRS IDs | Evidence / decision |
| --- | --- |
| ACC-024/025/028 | Verified/current-password/confirmed account deletion UI/API, cascades across private stores, shared actor anonymization, second account/tab checks |
| ACC-027 | Authenticated explicit owner-projected UTF-8 JSON export, documented format/exclusions, actual file-download/authorization/negative tests |
| NFR-SEC-001–003 | Production HTTPS/host cookie, existing Argon2id/capacity tests, env-only credentials and reviewed diff; no public deployment claim |
| NFR-SEC-004–011 | Backend auth/roles/ownership, schema/extra-field/body bounds, bound SQL, same-origin/CSRF, revocation/rate limits and redacted error/log cases |
| NFR-SEC-012 | Existing transactional redacted content/song audits; deletion anonymization tested without dropping shared history |
| NFR-SEC-013 | Zero runtime/npm/Python observations plus explicit one-advisory dev exception, scan evidence and failed patch-trial history |
| NFR-SEC-014 | Actual limited-role SQL writes/DDL refusal and runtime configuration/startup guards; provider IAM remains deployment-specific |
| NFR-PRI-001–004 | Local-only microphone/generated sound, explained permissions and denial fallbacks, private API/export/cascade/tab isolation |
| NFR-PRI-005–008 | Updated public privacy notice, retention/deletion/download controls, no app analytics, recorded source/tool/provider review with deployment gates |
| NFR-UX-001–009 | Responsive/keyboard/labels/text states, WCAG-targeted axe/tree/focus checks, reduced motion and consistent navigation; no formal certification claim |

No scoped MAY rows exist; no assigned row is silently dropped. A-034–038 and ADR-0023 record export reauthentication versus verification, retention/cleanup/tab behavior, production transport/roles, the bounded development advisory exception and isolated preview continuity. Requirements analysis, architecture/database/deletion notes, traceability, identity/security/training guides, setup/prerequisites, README and implementation plan are updated. Original source SRS/blueprint/master prompt are preserved.

## Failures, limits and remaining work

Initial static checks caught long lines and an inappropriate Pydantic import in domain code; corrected. The first hosted backend run 42954828959 passed 94 cases but caught missing version parameters in a new cross-owner mutation test and an overwritten existing private song cache label. Both were corrected; the original assertions were preserved. Runs 42955570288 and 42955857187 passed the backend suite but browser tests found newly ambiguous password/alert selectors; these now use exact/scoped controls. Run 42956371564 passed 16 journeys and exposed a real deletion-success redirect race; auth now preserves the successful deletion reason consistently in the protected redirect. Cross-tab clearing, POST forms and separate export persistence contracts were then verified. These failed attempts are not counted as passing evidence.

Dependency remediation was attempted without a forced downgrade. A clean npm resolve failed the existing React/radix peer tree. An npm-generated patched minimatch tree installed and audited clean but `npm ls` rejected dependency validity; override variants did not produce a supported tree. The original lock and dependencies were restored. Final scans retain **nine moderate development entries from GHSA-g3hv-75wg-m249 only**, with a documented exception expiring **2026-12-11**. The gate rejects unknown/runtime/high/critical/expired findings and incomplete scans. Compatible upstream lint remediation remains required; do not lint untrusted configurations. No full-clean-scan or supply-chain certification is claimed.

The public deployment must supply actual TLS/proxy trust, provider/contact/location, backup expiry/deletion-after-restore and external SMTP operating policies. The baseline registration status/eligible SMTP timing can reveal account existence; generic credential/recovery text and rate limits are mitigations, not enumeration resistance. CSP deliberately retains inline Next bootstrap scripts/styles. Live assistive-reader, physical tuner calibration and desired popular-song content-rights acquisition remain separate evidence/gates. No real role provisioning, deployment, backup erasure, hardware calibration or Phase 18 work was attempted.

### Local activation and environment

The C: drive reached zero free bytes during a local lint run. Phase-created package-cache files were first preserved on D:, then the rebuildable npm/pip caches were relocated under ignored `.artifacts/phase17-worktree/.artifacts/phase-created-cache` and `host-package-cache`. About **1.8 GB** was freed on C:. No project files, personal DB, private env/mail or other app services were removed. Further temporary/cache writes used D: process settings; no global npm setting changed. This resolved the local lint interruption.

The owner explicitly approved **Restart Docker and activate the preview** after the implementation/report/PR were ready. Normal `docker desktop restart --detach --timeout 90` failed because stuck processes would not stop. Only Docker Desktop/backend/build processes were closed, then only the observed `docker-desktop` WSL distribution was terminated and Desktop relaunched; the separate Ubuntu distribution was not stopped. No factory reset, container/volume removal or personal DB migration was performed. Docker returned running with engine 29.3.1. A combined launch command was rejected by automatic review ("blocked by policy"); a narrower standalone startup command was allowed and completed within the approved scope.

The original Chord House API/DB and Devtreck release containers recovered; the earlier Phase 16 preview DB/API were explicitly restarted. Original API 8000 and Phase 16 API 8001 readiness returned **200**; the Phase 16 training frontend on 127.0.0.2:3001 returned **200**. The original frontend had no listener, so its existing `npm run dev` was started without changing source; 127.0.0.1:3000/songs returned **200**. Devtreck release DB/API/web/proxy reported healthy. A stale query helper created by this task was stopped; unrelated stopped containers were left alone.

**Phase 17 local activation verified:** `python scripts/dev-preview.py --backend-only` built the locked image, upgraded/seeded the new isolated database and exited 0; API/DB reported healthy. The app runs as OS UID **10001**. The hidden preview launcher reports Next ready at **http://127.0.0.3:3002**; `/account` returned **200**. A disposable local account completed real signup, captured-email verification, login, owner-only JSON export and guest denial through this frontend proxy. The installed native Microsoft Edge then performed an actual JSON download, typed/checked account deletion, success redirect and session revocation. The disposable account and its captured code were removed through the normal verified deletion API; no test account was retained.

The first local UI pass exposed duplicate sibling component keys at the private-view/reminder boundary. **bbde6aa** namespaces those keys. The local Edge flow was rerun successfully with an explicit assertion of no duplicate-key console warnings, followed by the complete passing CI runs above. This was a real runtime correction, not a waived warning.

The preview is now running. Open **http://127.0.0.3:3002/account** and register a separate preview account; email verification is required before deletion, while export uses current-password confirmation. To restart later, run `python scripts/dev-preview.py` from the Phase 17 checkout. Project `chord-house-preview`, API 8002 and DB 5435 are separate from the original app and Phase 16 preview. Preserve its ignored `.env.preview` with the volume; do not replace existing credentials or delete volumes. Earlier accounts/private data and uncommitted song/player changes are not copied. See the setup/security guide for production, maintenance, privacy and stop instructions.

**Phase 17 exit gate met:** negative security, complete deletion/export and accessibility evidence pass on the final tested implementation, and local activation/download/deletion are also verified. Public-release readiness is not implied.

## Git and handover

Branch `codex/phase-17`, base `d01b8ca` (`codex/phase-16`), worktree `D:/RAYYAN/Projects/Chord-House/.artifacts/phase17-worktree`. Tested implementation through **bbde6aa** is pushed to the existing **private** remote. [PR 17](https://github.com/rayyanhasan899/Chord-House/pull/17) targets `codex/phase-16` and remains unmerged. No force push, visibility change or merge. A final documentation-only commit records exact evidence without rerunning unchanged application checks.

Original checkout stays on codex/phase-15 with its modified backend config/catalog/workspace/tests, frontend songs/styles/contracts/e2e/next-env and untracked root source documents, local catalog/song modules, player/tests and songs directory intact. Those changes were not staged, copied into implementation or certified by this phase. A copy of this report is supplied in the original Phase-Reports directory for discovery; the reviewed code is in the Phase 17 branch/worktree. Private generated env/mail/cache/audit tooling and synthetic artifacts remain ignored.

Next prompt: `docs/implementation/phase-prompts/PHASE-18.md`, only on owner instruction. Stop after Phase 17.

What you can use in the running Phase 17 preview: My account personal-data download; verified/confirmed permanent deletion with safe feedback; existing workspace, tuner/chords/metronome/patterns/songs, saved practice/goals/progress and training/reminders. Use the 127.0.0.3:3002 host for this version; the original app remains available with its preserved song changes at 127.0.0.1:3000.
