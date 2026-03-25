# auth/README

## Domain
Authentication & session management for CollabSphere, including local email/password auth, Google OAuth, email verification, password reset, refresh-token rotation, and logout flows.

## Canonical Sources
- `docs/spec/04-user-flows/04.2-user-onboarding.md` — FL-001 (register→verify→login)
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md` — FL-002 (Google OAuth)
- `docs/spec/05-features/05.1-authentication.md` — Authentication & Session Management
- `docs/spec/08-data-model/08.3-auth-users.md` — users + auth token tables
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — response envelopes, idempotency guidance
- `docs/spec/11-security/11.3-authentication-security.md` — auth/session security
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md` — rate limiting
- `docs/spec/12-errors/12.4-error-code-catalog.md` — canonical error taxonomy and codes
- `docs/spec/15-testing/15.6-required-test-suites.md` — auth testing requirements
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — domain event catalog (auth/security events)

## Included Topics
- Auth flows (register/login/verify/resend/refresh/logout/logout-all)
- OAuth flows (Google)
- Token model (JWT access + opaque refresh), rotation, storage guidance
- Auth-related data model tables + constraints
- Rate limits and non-enumerating endpoints
- Auth error codes + edge cases
- Auth testing requirements

## Related domains
- `workspaces/` (membership is not in JWT; auth only establishes identity)
- `admin/` (admin user deactivation/reactivation impacts auth)
- `activity-audit/` (audit log and security events)
- `quality/` (security baseline, testing strategy, observability)
