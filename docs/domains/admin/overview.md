## Canonical Sources
- `docs/spec/05-features/05.9-admin-console.md` — §5.9 Admin Console
- `docs/spec/02-personas-roles/02.1-personas.md` — Platform Admin persona

## Included Topics
- Scope of admin responsibilities
- Guardrails and safety principles for admin actions

## Admin Role (MUST)
- Access to the Admin Console MUST be restricted to users with the global role **ADMIN**.
- All admin actions MUST be logged in the immutable audit log.
- Dangerous actions (deactivation, deletion) MUST require explicit confirmation.
