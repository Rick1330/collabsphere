# auth/feature-spec

## Domain
Authentication & Session Management feature specification.

## Canonical Sources
- `docs/spec/05-features/05.1-authentication.md` — §5.1 Authentication & Session Management
- `docs/spec/11-security/11.3-authentication-security.md` — authentication security requirements
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md` — rate limiting
- `docs/spec/11-security/11.7-cors-csrf-headers.md` — CSRF/CORS requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error taxonomy
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — auth/security event names

## Included Topics
- Supported auth methods
- Password policy
- Session model and refresh token rotation
- Account status rules
- Observability and audit requirements for auth

## Supported auth methods (v1)
- Local email/password
- Google OAuth

## UX requirements (web)
Canonical routes:
- `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token`, `/oauth/callback/google`

Form requirements:
- Inline validation
- Disabled submit when invalid
- Loading states (no “spinner-only”)
- Error handling: toast + inline error, no stack traces

## Password policy (v1)
- min 8 chars
- must contain uppercase, lowercase, number, special

## Session model
- Access token: JWT 15m
- Refresh token: opaque 7d, rotated on refresh

Refresh token security:
- stored hashed server-side
- delivered via httpOnly cookie (recommended)

JWT claims:
- includes `sub`, `email`, `globalRole`, `iat`, `exp` (and optional `jti`)
- must not include workspace memberships

## Account linking
- Not supported in v1.
- Deny cross-provider linking without explicit future feature.

## Account lifecycle
- `unverified` accounts cannot login.
- deactivated accounts cannot login/refresh.
- soft deleted accounts cannot login.

## Audit/eventing
Auth MUST emit the full canonical set of security-relevant events for the audit log (see spec §5.1.10, §18.1.2, and `activity-audit/audit-log.md`). At minimum:
- `user.registered`, `user.verification_sent`, `user.email_verified`
- `user.login_succeeded`, `security.login_failed`
- `user.logout` (aka `user.logged_out` in §18.1.2), `user.refresh_succeeded`, `security.refresh_failed`
- `user.password_reset_requested`, `user.password_reset_completed`
- `admin.user_deactivated`, `admin.user_reactivated`

Admin-triggered auth consequences (per Admin domain):
- Deactivation MUST immediately revoke/block active sessions and refresh tokens; subsequent refresh MUST fail.
- Reactivation MUST NOT re-enable old refresh tokens; user MUST login again to obtain a new session/refresh pair.
