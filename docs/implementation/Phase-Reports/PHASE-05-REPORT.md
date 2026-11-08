# Phase 05 report

Date: 2026-11-08

Implemented: registration, validated normalized emails and uniqueness, Argon2id passwords, hashed opaque cookie sessions, 24h idle/7d absolute expiry, logout and password-change/reset revocation, exact Origin and session CSRF checks, PostgreSQL rate limits, backend roles, owner-scoped profile/preferences/onboarding, verification/reset mail adapter and single-use hashed codes, verified confirmed account deletion. Migration 0003 preserves prior account anchors. Export contract documented for Phase 17; OAuth unselected.

Verification: Ruff lint passed; Ruff formatted changed files; mypy passed for 25 app files. Complete real PostgreSQL suite: **16 passed**, no skips/warnings. Tests cover registration, duplicate normalization, password hashing, production cookie flags, CSRF/origin rejection, role escalation rejection and authorized role access, two-user profile isolation, password revocation/reset/replay, email verification/replay, idle/absolute expiry, logout, deletion, throttling and prior schema/domain regressions. No external SMTP delivery attempted; temporary private mail capture used.

Initial typing/import/format issues were corrected. Existing generated frontend type-file change and original untracked source documents preserved. No frontend implementation in this phase, so local browser tests await Phase 06; hosted CI retains regressions. SMTP retries/timing hardening, complete export/privacy UI and future resource deletion coverage remain later work. Expired session/token cleanup needs operational scheduling before production; no automatic permanent retention policy claimed. Production origin/SMTP settings must be configured securely.

Evidence: identity domain/schemas/service/repository/adapters/routes, migration 0003, test_identity.py, session-domain tests; ADR-0010; identity/session architecture notes and updated traceability/assumptions. No claims that all future personal resources are already authorized/tested. Argon2/SMTP are adapters; domain has no ORM/framework imports.

Git: codex/phase-05 based on codex/phase-04, no merge. Actual commit/push/PR and hosted results reported separately. Exit gate met locally by auth/revocation/CSRF/throttle/isolation tests. No real credentials or tokens tracked; development mail is ignored.

What you can use now: account/profile/auth APIs through a same-origin HTTP client or API docs; local verification/reset codes in private .local-mail. Existing foundation page/health/docs remain. Browser login/registration/onboarding forms come in Phase 06, next as explicitly authorized by the owner.
