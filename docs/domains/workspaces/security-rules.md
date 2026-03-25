# workspaces/security-rules

## Domain
Workspace isolation and RBAC enforcement rules.

## Canonical Sources
- `docs/spec/05-features/05.2-workspaces.md` — workspace rules and membership
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation and RBAC enforcement
- `docs/spec/08-data-model/08.1-entities.md` — workspace_id scoping on all entities
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — authorization standards for REST
- `docs/spec/13-observability/13.1-logging-metrics.md` — security/audit logging constraints

## Included Topics
- Workspace isolation constraints
- Authorization patterns for REST and realtime
- Archived workspace write blocking
- Testing requirements for isolation

## Workspace isolation (hard requirement)
- Every workspace-owned resource table MUST include `workspace_id`.
- All reads, writes, updates, deletes, and background jobs that operate on workspace-owned resources MUST filter by `workspace_id` and current active membership for the requesting actor.
- Resource IDs (document/task/comment/file/etc.) MUST NOT be sufficient to grant access; ID guessing MUST NOT bypass authorization (IDOR prevention).
- Search results, notifications, and activity feeds MUST be workspace-scoped and MUST NOT return or reference entities from other workspaces.
- Derived indexes (e.g., `content_plaintext`, search FTS) and background processing MUST preserve workspace isolation end-to-end.

## Membership enforcement
For all workspace-scoped access paths (REST, WebSocket, background jobs):
- Validate the user/session is an active member in `workspace_members` at access time (not only at session creation).
- If missing: return `403 NOT_WORKSPACE_MEMBER` (per canonical errors). Admin/global roles do not bypass per-workspace membership unless using explicit admin endpoints defined in spec.

## Role enforcement
- Enforce minimum role required per action using role hierarchy.
- Apply checks at guard/controller and service levels (defense-in-depth).

## Archived workspace policy
- When `workspaces.status=archived`, block writes (docs/tasks/files/etc.) with `WORKSPACE_ARCHIVED_READONLY`.

## Realtime join authorization
- Socket rooms `workspace:<workspaceId>` MUST require active workspace membership.
- Collaboration rooms `doc:<documentId>` MUST require membership in the document’s workspace.
- Room joins MUST verify workspace scoping for every reconnect; cached authorizations MUST NOT bypass current membership checks.

## Required security tests
- Permissions: user in workspace A MUST NOT access workspace B resources even if IDs are guessed (IDOR tests across all entity types).
- Search: queries MUST only return entities from the active workspace; admin/global search scoping MUST follow canonical admin rules and still apply per-entity ACLs.
- Files: presigned download and direct download endpoints MUST re-check membership and workspace_id at download time (not only at upload/attach time).
- Notifications/Activity: delivery MUST be limited to members of the originating workspace; cross-workspace leakage tests required.
