/**
 * Documents API adapter.
 *
 * Canonical surface for the document tree, version history, and the
 * shared types those features need (TreeNode, DocumentVersion,
 * REASON_META). Components MUST import from this module instead of
 * reaching into `@/features/documents/mocks/*` directly.
 */
import { MOCK_DOCUMENT_TREE } from "@/features/documents/mocks/document-tree";
import {
  MOCK_VERSIONS,
  REASON_META,
  getVersionHistory,
  type DocumentVersion,
  type VersionReason,
} from "@/features/documents/mocks/versions";
import type {
  TreeNode,
  TreeFolderNode,
  TreeDocumentNode,
} from "@/features/documents/components/document-tree";

export type {
  TreeNode,
  TreeFolderNode,
  TreeDocumentNode,
  DocumentVersion,
  VersionReason,
};
export { REASON_META, getVersionHistory };

/**
 * Synchronous seed tree exposed for editor/tree-panel views that currently
 * boot from in-memory state. Components import this from the adapter so the
 * dependency direction stays UI → adapter; the mock file is implementation
 * detail. Once the backend lands, surfaces will switch to
 * `await getDocumentTree(workspaceId)` and this re-export goes away.
 */
export { MOCK_DOCUMENT_TREE as SEED_DOCUMENT_TREE } from "@/features/documents/mocks/document-tree";

// ---------- Async data surface ----------

export async function getDocumentTree(_workspaceId: string): Promise<TreeNode[]> {
  // TODO(api): GET /workspaces/:id/documents/tree
  return MOCK_DOCUMENT_TREE;
}

export async function listDocumentVersions(
  documentId: string,
): Promise<DocumentVersion[]> {
  // TODO(api): GET /documents/:id/versions
  return getVersionHistory(documentId);
}

/** Total document count derived from the tree — useful for header chips. */
export async function countDocuments(workspaceId: string): Promise<number> {
  const tree = await getDocumentTree(workspaceId);
  let count = 0;
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.type === "document") count++;
      else walk(n.children);
    }
  };
  walk(tree);
  return count;
}

/** Direct access to the in-memory version map for tests / debug only. */
export const __TEST_ONLY_VERSIONS = MOCK_VERSIONS;
