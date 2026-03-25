# auth/security

## Domain
Auth security requirements and controls.

## Canonical Sources
- `docs/spec/11-security/11.3-authentication-security.md` — Authentication security; session security
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md` — Rate limiting
- `docs/spec/11-security/11.7-cors-csrf-headers.md` — CSRF/CORS
- `docs/spec/06-nfrs/06.5-security.md` — NFR security requirements
- `docs/spec/05-features/05.1-authentication.md` — §5.1 security requirements
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md` — OAuth flow and redirect handling

## Included Topics
- Password hashing and policy
- Token security (hashing, rotation, storage)
- OAuth security controls
- Rate limiting requirements
- CSRF/CORS considerations
- Audit logging requirements

## Password security
- MUST hash passwords using **bcrypt** (cost 12 in v1).
- MUST NOT log passwords.
- MUST enforce the canonical password policy (min 8 chars, mixed case, number, special).

## Token security
- MUST store only token hashes in DB (verification, reset, refresh tokens).
- Refresh token MUST be delivered via **httpOnly cookie** (recommended).
- MUST **rotate refresh tokens** on each refresh request.

## OAuth security
- MUST use OAuth 2.0 Authorization Code flow.
- MUST enforce and validate `state` parameter (anti-CSRF).
- PKCE is recommended for v1.
- If a `redirect` parameter is accepted by the backend, it MUST be validated against a strict allowlist and default to a safe route when invalid or missing.
- MUST use a strict **redirect URI allowlist**; MUST NOT accept arbitrary redirects.
- MUST request minimal scopes only (`openid`, `email`, `profile`).
- MUST NOT perform silent account linking in v1.

## Rate limiting (minimums)
- Register: 5/hour per IP + 5/hour per email
- Login: 10/min per IP
- Forgot password: 5/hour per email + 20/hour per IP
- Verify/reset token endpoints: 30/min per IP
- Refresh: 60/min per user

## CSRF and cookies
If refresh is cookie-based:
- MUST use `SameSite=Lax` (minimum).
- Refresh endpoint MUST be POST-only.
- MUST use `Secure` attribute in production.

## CORS
- MUST allow only trusted frontend origins.
- MUST NOT use wildcards in production.

## Audit logging
Auth and security events MUST be written to the audit log (see `docs/domains/activity-audit/audit-log.md` and spec §5.1.10).
