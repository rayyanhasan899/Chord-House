# Identity and sessions

Phase 05 supplies API registration, login/logout, preferences/onboarding, password change/reset, email verification, role guards and verified account deletion. Frontend forms follow in Phase 06. OAuth remains unselected.

Passwords use Argon2id. Validated emails are casefolded with database uniqueness. Legacy UUID anchors have nullable credentials and cannot log in. Profile inputs reject unknown fields, including owner IDs and role changes.

Random session cookies carry 256 bits of entropy; PostgreSQL stores SHA-256 verifiers. Cookies are HttpOnly and SameSite=Lax. Production uses host-only __Host-chord_session with Secure/Path=/ and matching secure deletion attributes; local development retains chord_session. Login replaces the browser's previous session. Activity renews the idle timestamp within a fixed seven-day absolute lifetime; idle timeout is 24 hours. Logout removes the session; password change/reset revokes all owner sessions. Raw session tokens never appear in JSON or browser storage.

Unsafe requests require an exact trusted Origin; authenticated changes also require X-CSRF-Token from GET /api/v1/me. Responses are no-store. No CORS allowance is configured. Database-backed IP/email buckets enforce 30 attempts per 15 minutes; session writes are limited too. Forwarded client-IP trust remains a deployment concern.

Verification/reset codes are random, hashed, single-use and valid for 30 minutes. New codes invalidate old ones. Generic request responses limit enumeration, but SMTP timing differences still need hardening review. Development mail is captured under gitignored .local-mail; protect these files with local OS permissions. Production requires configured SMTP and HTTPS origins. SMTP uses certificate-verified STARTTLS. No external mail was sent during testing. Mail delivery occurs within issuance transactions; a rare post-send commit failure can require a new code.

POST /me/delete requires CSRF, current password, verified email and confirm=true. All private stores, sessions/tokens and local captured mail are now covered by Phase 17 deletion/export/retention tests; shared catalog actor links anonymize. Each new private store must extend this evidence.

Phase 17 implemented export: POST /api/v1/me/export uses current-password confirmation, authenticated cookie, exact Origin and CSRF. Verified email is not required to export records the owner can already read; this refines the earlier proposed verified-export restriction. The explicit repository/field projections produce chord-house.personal-data.v1 JSON with exported_at, profile, records and exclusions, omitting credential/tokens/internal retry keys/shared licensed content. No export file is stored server-side. See SECURITY-AND-PRIVACY.md and ADR-0023 for complete record and retention policy.

Expired security rows are swept on startup and every 15 minutes while running, with an explicit maintenance command. Account-wide export/deletion throttles add five attempts/action/15 minutes. All API responses, including workspace/custom chords/errors, are no-store; browser auth changes reset private component state and supported tabs reload via a generic credential-free signal. Production enforces HTTPS and rejects admin/owner/CREATE/member/switched DB roles or migration credentials in the API process.

Roles are backend-only. /admin/access verifies the guard; content management and admin provisioning follow later. No account is automatically promoted.

References: [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Passing tests is not independent security certification.
