# Auth Schema (agent-ref)

## Purpose
Provide a compact, execution-focused reference for auth-related persistence models, constraints, and lifecycle rules.

## Canonical Sources
- `docs/domains/auth/data-model.md`
- `docs/domains/auth/feature-spec.md`
- `docs/domains/auth/security.md`
- `docs/spec/08-data-model/08.3-auth-users.md`
- `docs/spec/05-features/05.1-authentication.md`
- `docs/spec/11-security/11.3-authentication-security.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/auth/data-model.md`
- `docs/domains/auth/feature-spec.md`
- `docs/domains/auth/security.md`

## Scope
- `users` identity and status fields
- Refresh token storage/rotation tables
- Email verification and password reset token tables
- Deletion/revocation side effects

## Required Rules / Contract

### Table: `users`
Key fields:
- `email` (stored normalized lowercase; case-insensitive uniqueness; `citext` recommended)
- `auth_provider`: `local|google`
- `auth_provider_id`: provider subject id (google `sub`) when applicable
- `password_hash`: null for OAuth-only
- status flags: `is_verified`, `is_active`, `deleted_at`

Constraints:
- Unique email (case-insensitive) for active users
- Unique `(auth_provider, auth_provider_id)` when provider id exists

### Table: `refresh_tokens`
Key fields:
- `token_hash` (sha256; never store plaintext)
- `user_id` FK → users
- `replaced_by_token_id` (rotation chain)
- `revoked_at`
- `ip_address`, `user_agent` (optional)

Rules:
- Rotate refresh token on every refresh.
- Reuse detection should revoke token family (recommended).

### Table: `email_verification_tokens`
Key fields:
- `token_hash` (sha256)
- `user_id` FK → users
- `used_at` (single-use)
- `expires_at` (default 24h)

Rules:
- Reject reuse (`TOKEN_ALREADY_USED`) and expiry (`TOKEN_EXPIRED`).

### Table: `password_reset_tokens`
Key fields:
- `token_hash` (sha256)
- `user_id` FK → users
- `used_at` (single-use)
- `expires_at` (default 30 minutes)

Rules:
- Reset invalidates all refresh tokens.

### Deletion / Deactivation
- On user deactivation: revoke/disable all refresh tokens immediately.
- On user soft-delete: revoke refresh tokens; preserve audit/activity snapshots elsewhere.

## Edge Cases / Failure Modes
- Case-insensitive email duplicates must be prevented.
- OAuth-only user reset password: return generic success, no reset token/email.
- Reactivation does NOT restore prior refresh tokens; user must re-login.

## Validation or Testing Notes
- Validate email normalization and uniqueness.
- Ensure tokens are hash-only at rest.
- Verify refresh rotation + reuse detection.
- Test deactivation revokes refresh tokens and blocks refresh.

## Related Files / Domains
- `docs/agent-ref/api/auth-endpoints.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`


