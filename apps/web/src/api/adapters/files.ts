/**
 * Files API adapter.
 *
 * Canonical surface for the workspace files library. Reads and helpers
 * the UI consumes are re-exported here so pages stop reaching into the
 * underlying mock fixture directly.
 */
import { MOCK_FILES, type FileItem } from "@/lib/mock-files";

export {
  MOCK_FILES,
  formatBytes,
  type FileItem,
  type FileKind,
} from "@/lib/mock-files";

/** Async list endpoint — would call `request("/workspaces/:id/files")`. */
export async function listWorkspaceFiles(
  _workspaceId: string,
): Promise<FileItem[]> {
  // TODO(api): GET /workspaces/:id/files
  return MOCK_FILES;
}
