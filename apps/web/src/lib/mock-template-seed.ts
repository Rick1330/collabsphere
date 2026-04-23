// Helpers that turn template definitions into concrete artifacts:
//   • buildDocumentSeed(templateId) → HTML scaffold + intro for the editor.
//   • stash/read/clear pending new-document seeds via sessionStorage so the
//     editor can pick them up on the very next route load.
//
// This is the bridge that makes the "Template" picker on /documents/new and
// inside the tree-create dialog actually do something — picking a template
// changes the content the editor opens with.

import { getDocumentTemplate, getWorkspaceTemplate } from "./mock-templates";

const STORAGE_PREFIX = "collabsphere.pendingDoc.v1:";

export interface PendingDocSeed {
  title: string;
  templateId: string;
  templateName: string;
  contentHTML: string;
  folderName: string | null;
}

/**
 * Builds an HTML body for a brand new document based on a document template.
 * "doc-blank" returns a minimal opening prompt.
 */
export function buildDocumentSeed(
  title: string,
  templateId: string,
  folderName: string | null,
): PendingDocSeed {
  const trimmedTitle = title.trim() || "Untitled document";
  const tpl = getDocumentTemplate(templateId);
  if (!tpl || templateId === "doc-blank") {
    return {
      title: trimmedTitle,
      templateId: "doc-blank",
      templateName: "Blank document",
      folderName,
      contentHTML: `<h1>${escapeHtml(trimmedTitle)}</h1><p>Start writing your first paragraph here. Press <code>/</code> for commands (coming soon).</p>`,
    };
  }

  const intro = `<p><em>${escapeHtml(tpl.description)}</em></p>`;
  const sectionBlocks = tpl.preview.sections
    .map(
      (s) =>
        `<h2>${escapeHtml(s)}</h2><p style="color: rgb(120 113 108);">Drop content here…</p>`,
    )
    .join("");

  return {
    title: trimmedTitle,
    templateId: tpl.id,
    templateName: tpl.name,
    folderName,
    contentHTML: `<h1>${escapeHtml(trimmedTitle)}</h1>${intro}${sectionBlocks}`,
  };
}

const isBrowser = typeof globalThis.window !== "undefined";

export function stashPendingDoc(docId: string, seed: PendingDocSeed): void {
  if (!isBrowser) return;
  try {
    globalThis.window.sessionStorage.setItem(
      STORAGE_PREFIX + docId,
      JSON.stringify(seed),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function readPendingDoc(docId: string): PendingDocSeed | null {
  if (!isBrowser) return null;
  try {
    const raw = globalThis.window.sessionStorage.getItem(STORAGE_PREFIX + docId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDocSeed;
    return parsed && typeof parsed.contentHTML === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingDoc(docId: string): void {
  if (!isBrowser) return;
  try {
    globalThis.window.sessionStorage.removeItem(STORAGE_PREFIX + docId);
  } catch {
    /* ignore */
  }
}

/**
 * Returns the workspace-template seed (folders, starter docs, columns, …) for
 * a workspace stored in workspaceStore — null for the built-in mock workspaces
 * that weren't created from a template.
 */
export function getWorkspaceSeed(templateId: string | null | undefined) {
  if (!templateId) return null;
  return getWorkspaceTemplate(templateId) ?? null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
