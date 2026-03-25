# Template Schema (agent-ref)

## Purpose
Define the persistent schema, constraints, and lifecycle rules for workspace and document templates.

## Canonical Sources
- `docs/domains/templates/data-model.md`
- `docs/domains/templates/feature-spec.md`
- `docs/domains/templates/application-engine.md`
- `docs/spec/08-data-model/08.10-templates.md`
- `docs/spec/05-features/05.3-templates.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/templates/data-model.md`
- `docs/domains/templates/feature-spec.md`
- `docs/domains/templates/application-engine.md`

## Scope
- `templates` table fields and constraints
- Template content formats and schema versioning
- Enable/disable rules
- Workspace vs document template requirements
- Application invariants

## Required Rules / Contract

### Table: `templates`
Key fields:
- `id` (stable string, e.g., `tpl_doc_academic_srs_v1`)
- `kind`: `workspace|document`
- `category`: `professional|academic|general`
- `scope`: `system` (v1)
- `version` (template version)
- `schema_version` (schema compatibility)
- `content_format`: `markdown|json` (document templates)
- `content` (JSONB)
- `is_enabled` (boolean)

Constraints:
- `kind`, `category`, and `schema_version` MUST be validated before application.
- `scope=system` only in v1 (no user-defined templates).
- Disabled templates must not be selectable (return `TEMPLATE_DISABLED` or `TEMPLATE_NOT_FOUND`).

### Content strategy
- Workspace templates store structure JSON (folders/docs/taskBoard/settings).
- Document templates store markdown in JSONB (e.g., `{ "markdown": "# ..." }`) and are converted during document creation.

### Application invariants
- Template application is transactional for workspace creation.
- Document template application must seed Yjs state and derived plaintext for search.

## Edge Cases / Failure Modes
- Category mismatch: `TEMPLATE_CATEGORY_MISMATCH`.
- Unsupported schema version: `TEMPLATE_SCHEMA_UNSUPPORTED`.
- Missing template: `TEMPLATE_NOT_FOUND`.
- Disabled template: `TEMPLATE_DISABLED` (if distinguished).

## Validation or Testing Notes
- Validate `kind`, `category`, `scope`, and `schema_version` against allowed enums.
- Ensure `includeContent` previews are role-gated.
- Confirm document templates are converted to Tiptap/Yjs state on create.

## Related Files / Domains
- `docs/agent-ref/api/template-endpoints.md`
- `docs/agent-ref/api/workspace-endpoints.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/data/enums.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`


