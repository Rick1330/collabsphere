# templates/overview

## Domain
Templates overview.

## Canonical Sources
- `docs/spec/05-features/` — §5.3 Templates

## Included Topics
- Template goals and priorities
- Template kinds (workspace vs document)
- v1 scope limitations

## Template kinds

### Workspace templates (P0)
Generate entire workspace blueprint:
- folder hierarchy
- starter documents (via document template references)
- task board columns
- workspace settings defaults
- role label mapping (cosmetic)

### Document templates (P0)
Generate a single document:
- headings + placeholder content
- stored in markdown (recommended) or Tiptap JSON

## Scope
v1 uses built-in **system** templates. Workspace/user-created templates are future (v1.1+).
