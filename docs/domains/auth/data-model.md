# auth/data-model

## Domain
Persistence model for users and authentication/session artifacts.

## Canonical Sources
- `docs/spec/08-data-model/` — Users & Authentication tables
- `docs/spec/05-features/` — §5.1 data model notes

## Included Topics
- `users` identity fields and account status flags
- refresh token storage/rotation tables
- verification and password reset token tables

## Tables (authoritative)

### users
Key fields:
- `email` stored normalized lowercase; canonical spec also recommends `citext` for case-insensitive uniqueness.
- `auth_provider`: `local` or `google`
- `auth_provider_id`: provider subject id (google `sub`) when applicable
- `password_hash`: null for OAuth-only
- status flags: `is_verified`, `is_active`, `deleted_at`

Constraints:
- Case-insensitive unique email for active users
- Unique `(auth_provider, auth_provider_id)` when provider_id exists

### refresh_tokens
- stores `token_hash` (sha256), never plaintext
- supports rotation chain via `replaced_by_token_id`
- revocation via `revoked_at`
- stores optional `ip_address` and `user_agent`

### email_verification_tokens
- `token_hash` (sha256), single-use via `used_at`
- expiry default 24h

### password_reset_tokens
- `token_hash` (sha256), single-use via `used_at`
- expiry default 30 minutes

## Deletion policy
On user soft-delete:
- revoke all refresh tokens
- preserve audit/activity displays via snapshot fields elsewhere
