## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.5 Audit Logging Specifications
- `docs/spec/11-security/11.10-audit-logging.md` — audit security principles
- `docs/spec/08-data-model/08.9-activity-audit.md` — audit log tables

## Included Topics
- Audit event types and payload guarantees
- Immutable logging behavior and tamper resistance
- Access control and who can view audit entries
- Retention, export, and deletion policies

## Immutable and admin-only (MUST)
- Audit log entries MUST be immutable and append-only.
- MUST NOT allow edits or deletions except per canonical retention/expunge jobs.
- Access MUST be restricted to Platform Admins; regular users MUST NOT see audit entries.

## Event coverage (MUST)
MUST include the full canonical set from spec §5.1.10 and appendices (§18.1.2), at minimum:
- Auth: `user.registered`, `user.verification_sent`, `user.email_verified`, `user.login_succeeded`, `security.login_failed`, `user.logged_out`, `user.refresh_succeeded`, `security.refresh_failed`, `user.password_reset_requested`, `user.password_reset_completed`.
- Security/Admin: `security.account_deactivated`, `security.account_reactivated`, `security.session_revoked`, `admin.user_deactivated`, `admin.user_reactivated`, `admin.role_changed`.
- Files: sensitive access granted/denied, attachment added/removed.

## Retention & export (MUST)
- Retention window MUST be at least **365 days** (v1 default) and MUST meet compliance requirements.
- Export MUST produce tamper-evident records with hashes/signatures per spec.

## Redaction & privacy (MUST)
- MUST NOT log secrets, access tokens, presigned URLs, or raw search queries.
- MUST use hashed/redacted forms where necessary.
