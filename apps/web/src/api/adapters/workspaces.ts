/**
 * Workspace API adapter.
 *
 * Wraps the existing localStorage-backed workspace store. UI components
 * should import from this module rather than the store directly when
 * doing read-style fetches; mutating the store still goes through
 * `workspaceStore` (it owns the localStorage write side and event fan-out).
 *
 * When a real backend lands, swap each function body for `request(...)`
 * from src/api/client and delete the store reach-throughs below.
 */
import type { WorkspaceSummaryContract } from "@/api/contracts";
import {
  workspaceStore,
  type StoredWorkspace,
} from "@/features/workspace/store/workspace-store";

export async function listMyWorkspaces(): Promise<WorkspaceSummaryContract[]> {
  return workspaceStore.getAll().map((w) => ({
    id: w.id,
    slug: w.id,
    name: w.name,
    memberCount: 1,
    updatedAt: w.lastAccessedAt,
  }));
}

export async function getStoredWorkspace(
  id: string,
): Promise<StoredWorkspace | null> {
  return workspaceStore.getById({ workspaceId: id }) ?? null;
}
