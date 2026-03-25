# templates/api-contracts

## Domain
Template listing and preview API contracts.

## Canonical Sources
- `docs/spec/05-features/` — §5.3.9 API contracts
- `docs/spec/09-api-standards/` — envelopes/pagination
- `docs/spec/12-errors/` — TEMPLATE_NOT_FOUND etc.

## Included Topics
- List templates
- Get template for preview
- Using templates through workspace/document creation endpoints

## Endpoints

### List templates
`GET /api/v1/templates`
Query params:
- `kind=workspace|document`
- `category=professional|academic|general`
- `scope=system` (v1)
- `search` (optional)

### Get template
`GET /api/v1/templates/:templateId`
- Preview should not return huge content by default.
- Optional `?includeContent=true` for document template content (role-gated).

## Using templates
- Workspace template selected via `POST /api/v1/workspaces` body `templateId`.
- Document template selected via `POST /api/v1/workspaces/:workspaceId/documents` body `templateId`.

## Errors
- `404 TEMPLATE_NOT_FOUND`
- `403 TEMPLATE_DISABLED` (if distinguished)
- `400 TEMPLATE_CATEGORY_MISMATCH`
- `400 TEMPLATE_SCHEMA_UNSUPPORTED`
