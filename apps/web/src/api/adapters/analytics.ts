/**
 * Analytics API adapter.
 *
 * Canonical surface for the workspace analytics snapshot. Exposes the
 * shared types and an async fetcher keyed on workspace type so the
 * Analytics page no longer imports the mock fixture directly.
 */
import {
  MOCK_ANALYTICS,
  MOCK_ANALYTICS_ACADEMIC,
  type AnalyticsSnapshot,
} from "@/lib/mock-analytics";

export type {
  AnalyticsSnapshot,
  KpiBlock,
} from "@/lib/mock-analytics";

export async function fetchAnalyticsSnapshot(
  _workspaceId: string,
  workspaceType: "professional" | "academic" | "general",
): Promise<AnalyticsSnapshot> {
  // TODO(api): GET /workspaces/:id/analytics
  return workspaceType === "academic" ? MOCK_ANALYTICS_ACADEMIC : MOCK_ANALYTICS;
}
