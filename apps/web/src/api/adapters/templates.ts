/**
 * Templates API adapter.
 *
 * Canonical surface for workspace + document templates: catalog reads,
 * lookup helpers, and the seed/stash utilities used when creating a new
 * document from a template. UI components import from here rather than
 * from `@/lib/mock-templates` / `@/lib/mock-template-seed`.
 */
export {
  WORKSPACE_TEMPLATES,
  DOCUMENT_TEMPLATES,
  getDocumentTemplate,
  getWorkspaceTemplate,
  type WorkspaceTemplate,
  type DocumentTemplate,
  type TemplateCategory,
} from "@/lib/mock-templates";

export {
  buildDocumentSeed,
  stashPendingDoc,
  readPendingDoc,
  clearPendingDoc,
} from "@/lib/mock-template-seed";
