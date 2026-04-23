/**
 * Activity API adapter.
 *
 * Canonical surface for the workspace activity feed. UI components import
 * the paginated fetcher and the `ActivityEvent` type from this module.
 * The underlying mock implementation lives in `@/lib/mock-activity` and is
 * an internal detail of the adapter.
 */
export {
  fetchWorkspaceActivityPaginated,
  type ActivityEvent,
  type ActivityEventKey,
} from "@/lib/mock-activity";
