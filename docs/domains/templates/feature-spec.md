# templates/feature-spec

## Domain
Templates feature spec (behavior + constraints).

## Canonical Sources
- `docs/spec/05-features/` — §5.3 Templates

## Included Topics
- Template browsing/preview behavior
- Permissions for using templates
- Built-in library minimum set

## Browsing & preview
- During workspace creation, template list is filtered by chosen workspace type.
- Template preview should summarize:
  - folder/document counts
  - task columns
  - key settings like submission workflow

Templates page (P1): `/w/:workspaceId/templates`
- Browse built-in templates
- Use document templates to create docs
- Workspace templates used only during workspace creation in v1

## Permissions
- Use system templates:
  - Document templates: Member+
  - Workspace templates: any authenticated user during workspace creation
- Managing templates:
  - v1: no editing via UI
  - v1.1+: workspace custom templates Owner/Admin

## Template library (v1 minimum)
- Workspace: Software Dev Project; Sprint Workspace; Client Project; Senior Project; Research Thesis; Group Assignment; Blank Workspace
- Document: PRD; RFC; ADR; Sprint Retro; Meeting Notes; Proposal; RAD; SRS; System Design; Weekly Progress; Meeting Minutes; Final Report Outline

## Edge cases
- Disabled template hidden in UI; API returns not found/disabled.
- Workspace type/category mismatch rejected (`TEMPLATE_CATEGORY_MISMATCH`).
- Unsupported formatting sanitized on import/conversion.
