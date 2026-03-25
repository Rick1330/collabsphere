# Template Endpoints (agent-ref)

## Purpose
Provide execution-focused REST endpoint contracts for templates, including required parameters, auth, and error codes.

## Canonical Sources
- `docs/domains/templates/api-contracts.md`
- `docs/domains/templates/application-engine.md`
- `docs/domains/templates/data-model.md`
- `docs/spec/05-features/05.3-templates.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/09-api-standards/09.5-pagination.md`
- `docs/spec/09-api-standards/09.6-idempotency.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/templates/api-contracts.md`
- `docs/domains/templates/application-engine.md`
- `docs/domains/templates/data-model.md`

## Scope
- Template listing and preview endpoints
- Query parameters and response shapes
- Role and auth requirements
- Error codes and invariants
- Template usage via workspace/document creation

## Required Rules / Contract

### Base path
- `/api/v1/templates`

### Auth
- Auth required for template list and preview.
- Template selection for creation requires standard workspace/document create permissions.

### Endpoints

#### 1) List templates
`GET /api/v1/templates`

Query params:
- `kind=workspace|document`
- `category=professional|academic|general`
- `scope=system` (v1)
- `search=<string>` (optional)

Response:
- Standard list envelope with pagination (page size defaults to 25).

#### 2) Get template
`GET /api/v1/templates/:templateId`

Notes:
- Preview should NOT return large content by default.
- Optional `?includeContent=true` may return document template content (role-gated).

#### 3) Use template (via create endpoints)
- Workspace template: `POST /api/v1/workspaces` with `templateId`.
- Document template: `POST /api/v1/workspaces/:workspaceId/documents` with `templateId`.

### Errors (canonical)
- `404 TEMPLATE_NOT_FOUND`
- `403 TEMPLATE_DISABLED` (if disabled)
- `400 TEMPLATE_CATEGORY_MISMATCH`
- `400 TEMPLATE_SCHEMA_UNSUPPORTED`
- `400 VALIDATION_ERROR` (bad params)
- `403 FORBIDDEN` (role not allowed)

### Invariants
- Template `kind`, `category`, and `schema_version` must be validated before applying.
- Template application is transactional and idempotent at create endpoints.
- Do not silently fallback to other templates if the requested template is invalid.

## Edge Cases / Failure Modes
- `includeContent=true` for document templates is role-gated; deny if not allowed.
- Category mismatch (e.g., academic template for professional workspace) must fail with `TEMPLATE_CATEGORY_MISMATCH`.
- Unsupported `schema_version` must fail with `TEMPLATE_SCHEMA_UNSUPPORTED`.
- Invalid or missing `templateId` yields `TEMPLATE_NOT_FOUND`.

## Validation or Testing Notes
- Validate query params for `kind`, `category`, `scope`.
- Ensure template application uses idempotency where required (`X-Idempotency-Key` on create endpoints).
- Verify no template content is returned when `includeContent` is absent.

## Related Files / Domains
- `docs/agent-ref/api/workspace-endpoints.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/data/template-schema.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`


