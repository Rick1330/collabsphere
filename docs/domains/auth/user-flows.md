# auth/user-flows

## Domain
End-to-end auth onboarding and login flows.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-001 User onboarding; FL-002 OAuth onboarding
- `docs/spec/05-features/` — Authentication & Session Management (§5.1)

## Included Topics
- Register → verify email → login
- Google OAuth sign-in/sign-up
- Edge cases and required side effects/events

## FL-001 — Register → Verify Email → Login (local auth)

### Preconditions
- User has inbox access.
- Email provider configured.
- Email not already registered (case-insensitive).

### Client validation (required)
- Email format
- Password policy (min 8 chars + uppercase + lowercase + number + special)
- Confirm password match

### Server steps (authoritative)
1. `POST /api/v1/auth/register`
   - Validate input.
   - Duplicate email check is case-insensitive.
   - Hash password (bcrypt cost 12).
   - Create user with `is_verified=false`, `is_active=true`, `auth_provider=local`.
   - Create email verification token (24h expiry), store token hash.
   - Send verification email.
2. User clicks verification link → frontend route `/verify-email/:token`.
3. Frontend calls `POST /api/v1/auth/verify-email`.
   - Validate token exists, not expired, not used.
   - Set `users.is_verified=true`.
   - Mark token as used.
4. `POST /api/v1/auth/login`
   - Validate credentials.
   - Require `is_verified=true` and `is_active=true` and `deleted_at IS NULL`.
   - Issue access token (JWT 15m) + refresh token (opaque 7d, stored hashed in DB).

### Events emitted (internal bus)
Canonical event list includes:
- `user.registered`
- `user.verification_sent`
- `user.email_verified`
- `user.logged_in` / `user.login_succeeded` (naming differs across sections; treat canonical `docs/spec/18-appendices` as authoritative)
- `security.login_failed`

### Required edge cases
- Duplicate email → `409 EMAIL_ALREADY_EXISTS`
- Case-insensitive duplicates treated as duplicates
- Weak password → `400 VALIDATION_ERROR` (or `PASSWORD_TOO_WEAK` if implemented)
- Login before verification → `403 EMAIL_NOT_VERIFIED`
- Expired verification link → `410 TOKEN_EXPIRED`
- Reused verification link → `400 TOKEN_ALREADY_USED`
- Email provider failure: registration still succeeds; resend available; background retry worker
- Rate limiting: return `429 RATE_LIMITED`

## FL-002 — Google OAuth onboarding

### Start
User clicks “Continue with Google” from:
- `/login`, `/register`, or `/invite/:token`

Recommended implementation:
- `GET /api/v1/auth/google?redirect=/dashboard` initiates backend redirect.

### Callback
- `GET /api/v1/auth/google/callback?code=...&state=...`
Server:
- Validates `state` (and PKCE verifier if used).
- Exchanges code, fetches profile (`sub`, email, name, picture).
- Lookup order:
  1) by `(auth_provider=google, auth_provider_id=sub)`
  2) else by email
- If email exists but local auth → deny (no silent merge) with `ACCOUNT_EXISTS_LOCAL`.

### Session issuance
- Access token JWT (15m)
- Refresh token (7d) stored hashed; cookie settings include `httpOnly`, `secure` in prod, `sameSite=Lax`, narrow cookie path recommended.

### Required edge cases
- User cancels consent → redirect to `/login` with message
- Missing code → `OAUTH_INVALID_CALLBACK`
- State mismatch → `OAUTH_STATE_MISMATCH` (security-critical)
- Provider unavailable → `OAUTH_PROVIDER_UNAVAILABLE`
- Invite-started OAuth: after login, redirect back to invite continuation.
