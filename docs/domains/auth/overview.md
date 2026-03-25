# auth/overview

## Domain
Authentication & Session Management.

## Canonical Sources
- `docs/spec/05-features/05.1-authentication.md` — Authentication & Session Management
- `docs/spec/04-user-flows/04.2-user-onboarding.md` — FL-001 register/verify/login
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md` — FL-002 Google OAuth
- `docs/spec/11-security/11.3-authentication-security.md` — auth/session security
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md` — auth rate limits
- `docs/spec/11-security/11.7-cors-csrf-headers.md` — CORS/CSRF rules
- `docs/spec/12-errors/12.4-error-code-catalog.md` — auth error codes
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — API conventions (envelopes, auth headers)

## Included Topics
- Authentication methods (local, Google OAuth)
- Session strategy (JWT access token + refresh token)
- Account lifecycle states and how they map to DB fields

## Authentication methods

### Local (email + password)
Canonical behavior:
- Passwords MUST be **hashed** (bcrypt cost factor 12 in v1) and MUST NEVER be logged.
- Accounts MUST require **email verification** before login.

### Google OAuth (Authorization Code flow)
Canonical behavior:
- MUST use OAuth 2.0 Authorization Code flow.
- MUST use `state` parameter (anti-CSRF). PKCE is recommended.
- Minimal scopes: `openid email profile`.
- **No automatic account linking** in v1:
  - If email exists under local auth and user tries Google OAuth → MUST deny with `ACCOUNT_EXISTS_LOCAL`.

## Account lifecycle mapping (global)
Canonical mapping MUST use:
- `users.is_verified`
- `users.is_active`
- `users.deleted_at`

States:
- **unverified**: `is_verified=false`, `is_active=true`, `deleted_at=null`
- **active**: `is_verified=true`, `is_active=true`, `deleted_at=null`
- **deactivated**: `is_active=false`
- **deleted**: `deleted_at != null`

## Token/session model
Canonical requirements:
- Access token: **JWT**, 15 minute TTL.
- Refresh token: **opaque random string**, 7 day TTL, MUST be stored as **httpOnly cookie** (recommended), MUST be stored **hashed** server-side.
- Refresh tokens MUST be **rotated on refresh**.
- MUST NOT include workspace memberships in JWT; membership MUST be checked per request.

## Cross-cutting requirements
- All responses MUST include `requestId` and MUST NOT leak stack traces.
- Rate limiting MUST be applied to all auth endpoints.
- Non-enumeration: resend verification and forgot-password MUST return the same response whether or not the account exists.
- If refresh uses cookies: SameSite=Lax minimum, POST-only refresh endpoint, and Secure in production (per CSRF guidance).
