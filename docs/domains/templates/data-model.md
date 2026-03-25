# templates/data-model

## Domain
Template persistence model.

## Canonical Sources
- `docs/spec/08-data-model/` — templates table
- `docs/spec/05-features/` — template schemas

## Included Topics
- `templates` table fields
- How content is stored for workspace vs document templates
- Versioning and schemaVersion

## templates table (authoritative)
Key fields:
- `id` stable string (e.g., `tpl_doc_academic_srs_v1`)
- `kind`: workspace|document
- `category`: professional|academic|general
- `scope`: system (v1)
- `version`, `schema_version`
- `content_format`: markdown|json (document templates)
- `content`: JSONB
- `is_enabled`

## Content strategy
- Workspace templates store structure JSON (folders/docs/taskBoard/settings).
- Document templates store markdown in JSONB (e.g., `{ "markdown": "# ..." }`) and are converted during doc creation.
