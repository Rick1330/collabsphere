# auth/api-contracts

## Domain
Auth REST endpoints and their contracts.

## Canonical Sources
- `docs/spec/05-features/05.1-authentication.md` — §5.1 API Contracts
- `docs/spec/04-user-flows/04.2-user-onboarding.md` — FL-001 (register/verify/login)
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md` — FL-002 (Google OAuth)
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes, auth headers, pagination, idempotency
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes

## Included Topics
- Endpoint list under `/api/v1/auth`
- Request/response shapes
- Error codes
- Non-enumeration requirements

## API standards applied
- Access token sent via `Authorization: Bearer <jwt>`.
- Refresh token typically via `httpOnly` cookie.
- Error response envelope includes `error.code` + `requestId`.

## Endpoints (authoritative summary)

### Register
`POST /api/v1/auth/register`
- 201 success: message only
- Errors: `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`, `429 RATE_LIMITED`
- Side effects: create user (unverified), create verification token (24h), send email

### Resend verification
`POST /api/v1/auth/resend-verification`
- 200 always returns non-enumerating message
- Must not reveal whether account exists.

### Verify email
`POST /api/v1/auth/verify-email`
- Errors: `400 TOKEN_INVALID`, `410 TOKEN_EXPIRED`, `400 TOKEN_ALREADY_USED`

### Login
`POST /api/v1/auth/login`
- 200 returns access token + user payload
- Refresh token delivered via cookie
- Errors: `400 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `403 ACCOUNT_DEACTIVATED`

### Refresh
`POST /api/v1/auth/refresh`
- 200 returns new access token
- Errors: `401 REFRESH_TOKEN_MISSING`, `401 REFRESH_TOKEN_INVALID`, `403 ACCOUNT_DEACTIVATED`
- Side effects: rotate refresh token

### Logout
`POST /api/v1/auth/logout`
- invalidates current refresh token; clears cookie

### Logout all
`POST /api/v1/auth/logout-all`
- invalidates all refresh tokens; clears cookie

### Forgot password
`POST /api/v1/auth/forgot-password`
- 200 non-enumerating response

### Reset password
`POST /api/v1/auth/reset-password`
- Errors: `400 TOKEN_INVALID`, `410 TOKEN_EXPIRED`, `400 TOKEN_ALREADY_USED`
- Side effects: invalidate all refresh tokens

### Google OAuth
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`

Errors (canonical):
- `401 OAUTH_INVALID_CALLBACK`
- `401 OAUTH_STATE_MISMATCH`
- `503 OAUTH_PROVIDER_UNAVAILABLE`

Redirect param allowlist requirement applies.
