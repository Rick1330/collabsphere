# Auth Endpoints (agent-ref)

## Purpose
Execution-focused reference for authentication endpoints, request/response expectations, and required error codes.

## Canonical Sources
- `docs/domains/auth/api-contracts.md`
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/auth/security.md`
- `docs/spec/05-features/05.1-authentication.md`
- `docs/spec/04-user-flows/04.2-user-onboarding.md`
- `docs/spec/04-user-flows/04.3-oauth-onboarding.md`
- `docs/spec/09-api-standards/09.7-auth-standards.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/auth/api-contracts.md`
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/auth/security.md`

## Scope
- `/api/v1/auth/*` endpoints
- Auth requirements, token handling, non-enumeration rules
- Canonical error codes
- Side effects (tokens, emails, revocation)

## Required Rules / Contract
- Access token via `Authorization: Bearer <jwt>`.
- Refresh token via httpOnly cookie (`refresh_token`).
- Non-enumerating responses for resend/forgot flows.
- Token hashes only in DB (no plaintext).
- Refresh tokens rotate on every refresh.
- OAuth redirect URI allowlist enforced.

## Endpoints

### Register
`POST /api/v1/auth/register`
- 201: message only
- Side effects: create user (unverified), create verification token (24h), send email
- Errors: `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`, `429 RATE_LIMITED`

### Resend Verification
`POST /api/v1/auth/resend-verification`
- 200 generic message; MUST NOT reveal account existence

### Verify Email
`POST /api/v1/auth/verify-email`
- 200 `{ data: { message: string } }` on success
- Errors: `400 TOKEN_INVALID`, `410 TOKEN_EXPIRED`, `400 TOKEN_ALREADY_USED`, `400 VALIDATION_ERROR`, `429 RATE_LIMITED`
- **Status-code overrides** (vs. catalog default): `TOKEN_INVALID` → `400` (not `401`); `TOKEN_EXPIRED` → `410` (not `400`). See `apps/api/src/auth/auth.service.ts` `createVerifyEmailService` for the override implementations and cross-reference `docs/spec/12-errors/12.4-error-code-catalog.md §verify-email overrides`.
- **Rate limit**: 10 requests / 5 minutes / IP. Implemented in `apps/api/src/auth/verify-email-rate-limit.ts`.
- **Soft-delete guard**: tokens belonging to soft-deleted users (`user.deletedAt !== null`) are treated as non-existent (`TOKEN_INVALID`).

### Login
`POST /api/v1/auth/login`
- 200 returns access token + user payload; refresh token via cookie
- Errors: `400 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `403 ACCOUNT_DEACTIVATED`

### Refresh
`POST /api/v1/auth/refresh`
- 200 returns new access token; refresh token rotated
- Errors: `401 REFRESH_TOKEN_MISSING`, `401 REFRESH_TOKEN_INVALID`, `403 ACCOUNT_DEACTIVATED`

### Logout
`POST /api/v1/auth/logout`
- Invalidates current refresh token; clears cookie

### Logout All
`POST /api/v1/auth/logout-all`
- Invalidates all refresh tokens; clears cookie

### Forgot Password
`POST /api/v1/auth/forgot-password`
- 200 non-enumerating response

### Reset Password
`POST /api/v1/auth/reset-password`
- Errors: `400 TOKEN_INVALID`, `410 TOKEN_EXPIRED`, `400 TOKEN_ALREADY_USED`
- Side effects: invalidate all refresh tokens

### Google OAuth
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`
- Errors: `401 OAUTH_INVALID_CALLBACK`, `401 OAUTH_STATE_MISMATCH`, `503 OAUTH_PROVIDER_UNAVAILABLE`

## Edge Cases / Failure Modes
- Case-insensitive email duplicates.
- OAuth account with same email as local → deny, no auto-link.
- Deactivated account: access token may live until expiry, refresh MUST fail.
- Password reset for OAuth-only user: return generic 200; no reset email.

## Validation or Testing Notes
- Non-enumerating responses for resend/forgot.
- Refresh token rotation and reuse detection.
- Deactivation revokes refresh tokens and blocks refresh attempts.
- OAuth redirect allowlist enforcement.

## Related Files / Domains
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/rate-limits.md`
- `docs/agent-ref/events/domain-events.md`


