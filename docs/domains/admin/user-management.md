## Domain
Admin — User Management

## Canonical Sources
- `docs/spec/05-features/05.9-admin-console.md` — admin user management features
- `docs/spec/02-personas-roles/02.2-role-definitions.md` — roles and permissions
- `docs/spec/11-security/11.3-authentication-security.md` — account security and deactivation effects

## Included Topics
- Admin operations on users (view, deactivate, reactivate, role changes)
- Side effects of deactivation (e.g., token revocation) as defined in the spec
- Constraints and auditability of high-risk operations

## Deactivation/reactivation (MUST)
- Deactivation MUST revoke or block all active sessions and refresh tokens immediately; subsequent refresh attempts MUST fail and log `auth.refresh_failed` with `ACCOUNT_DEACTIVATED` context.
- Reactivation MUST NOT re-enable prior refresh tokens; user MUST complete a fresh login to obtain new tokens.
- Audit events MUST be emitted: `admin.user_deactivated`/`admin.user_reactivated` and `security.session_revoked` where applicable.

## Dangerous actions confirmations (MUST)
- Follow the canonical pattern requiring the admin to type the exact user email/identifier before executing deactivation or role demotion.
