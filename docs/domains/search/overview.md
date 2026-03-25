# search/overview

## Domain
Search overview: modes, scope, and high-level constraints.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — FL-009 search journeys and modes
- `docs/spec/05-features/05.4-documents.md` — document search fields (plaintext)
- `docs/spec/05-features/05.5-tasks.md` — task search fields
- `docs/spec/06-nfrs/06.2-performance.md` — search latency targets
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation and RBAC constraints

## Included Topics
- High-level search goals and supported use cases
- Scope of searchable entities (documents, tasks, comments, workspaces, etc.)
- Core constraints (permissions-aware search, workspace isolation, performance expectations)

## Search modes
Canonical search MUST support three modes:
1. **Workspace-Scoped Search** (default inside a workspace).
2. **Global Search** (across all user's workspaces).
3. **Admin Global Search** (platform admin only; global scope).

## Constraints
- All search results MUST be permissions-aware; users MUST NOT see entities they cannot access.
- All search queries MUST be workspace-isolated by default.
- Search latency MUST meet NFR targets (P99 < 800ms).
