# auth/errors-edge-cases

## Domain
Auth-specific error codes and edge-case handling.

## Canonical Sources
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error taxonomy and codes
- `docs/spec/05-features/05.1-authentication.md` — §5.1 edge cases
- `docs/spec/04-user-flows/04.2-user-onboarding.md` — FL-001 edge cases
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md` — FL-002 edge cases

## Included Topics
- Canonical error codes used by auth
- Non-enumerating endpoint behavior
- Token expiry/reuse behaviors

## Common error codes

### 400 (validation)
- `VALIDATION_ERROR`
- `PASSWORD_TOO_WEAK` (if split from VALIDATION_ERROR)
- `INVALID_CREDENTIALS`
- `PASSWORD_SAME_AS_CURRENT`
- `TOKEN_INVALID`
- `TOKEN_ALREADY_USED`

### 401 (authentication)
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `TOKEN_INVALID`
- `REFRESH_TOKEN_MISSING`
- `REFRESH_TOKEN_INVALID`
- `OAUTH_INVALID_CALLBACK`
- `OAUTH_STATE_MISMATCH`

### 403 (authorization / account state)
- `EMAIL_NOT_VERIFIED`
- `ACCOUNT_DEACTIVATED`
- `OAUTH_USER_NO_PASSWORD`

### 409 (conflict)
- `EMAIL_ALREADY_EXISTS`

### 429
- `RATE_LIMITED`

### 503
- `EMAIL_PROVIDER_UNAVAILABLE`

## Edge cases (must be handled)
- Case-insensitive email duplicates
- Login attempts before verification
- Verification/reset token expiry and reuse
- Email provider downtime: registration succeeds, but resend flow + retries required
- Refresh token reuse after rotation: detect and revoke refresh token family (recommended)
- Password reset requested for OAuth-only user: return 200 generic message; no reset email or send guidance email
- OAuth account with same email as local: deny, no auto-link
- Account deactivated while session active: access token may remain valid until expiry but all refresh attempts MUST fail; sensitive routes SHOULD re-check account state.
- Account reactivated: prior refresh tokens MUST remain invalid; user MUST perform fresh login.
- Admin-forced logout-all: all sessions/refresh tokens MUST be invalidated; subsequent API calls MUST return 401 with `UNAUTHORIZED` per spec.
