# Identity and sessions

Phase 05 supplies API registration, login/logout, preferences/onboarding, password change/reset, email verification, role guards and verified account deletion. Frontend forms follow in Phase 06. OAuth remains unselected.

Passwords use Argon2id. Validated emails are casefolded with database uniqueness. Legacy UUID anchors have nullable credentials and cannot log in. Profile inputs reject unknown fields, including owner IDs and role changes.

Random session cookies carry 256 bits of entropy; PostgreSQL stores SHA-256 verifiers. Cookies are HttpOnly, SameSite=Lax and Secure in production. Login replaces the browser's previous session. Activity renews the idle timestamp within a fixed seven-day absolute lifetime; idle timeout is 24 hours. Logout removes the session; password change/reset revokes all owner sessions. Raw session tokens never appear in JSON or browser storage.

Unsafe requests require an exact trusted Origin; authenticated changes also require X-CSRF-Token from GET /api/v1/me. Responses are no-store. No CORS allowance is configured. Database-backed IP/email buckets enforce 30 attempts per 15 minutes; session writes are limited too. Forwarded client-IP trust remains a deployment concern.

Verification/reset codes are random, hashed, single-use and valid for 30 minutes. New codes invalidate old ones. Generic request responses limit enumeration, but SMTP timing differences still need hardening review. Development mail is captured under gitignored .local-mail; protect these files with local OS permissions. Production requires configured SMTP and HTTPS origins. SMTP uses certificate-verified STARTTLS. No external mail was sent during testing. Mail delivery occurs within issuance transactions; a rare post-send commit failure can require a new code.

POST /me/delete requires CSRF, current password, verified email and confirm=true. Existing account sessions/tokens/private notes cascade; shared catalogue remains. Future private modules must extend deletion tests.

Export contract for Phase 17: verified reauthenticated users receive versioned JSON with generated_at, profile/preferences and owner-scoped workspace/practice records. Exclude credential hashes, sessions/CSRF/reset tokens, internal moderation and content without redistribution rights. Each module must provide an explicit export query. No export endpoint is claimed implemented now.

Roles are backend-only. /admin/access verifies the guard; content management and admin provisioning follow later. No account is automatically promoted.

References: [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Passing tests is not independent security certification.
