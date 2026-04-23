/**
 * Admin API adapter.
 *
 * Canonical surface for the operations console: paginated reads (users,
 * workspaces, audit), KPI/dashboard fetches, and admin mutations
 * (deactivate/promote, archive/force-delete). UI components MUST import
 * from this module rather than from `@/lib/mock-admin`.
 */
export {
  fetchAdminOperationalStats,
  fetchRecentCriticalEvents,
  fetchTopWorkspaces,
  fetchAdminUsers,
  fetchAdminUserDetail,
  fetchAdminWorkspaces,
  fetchAuditLog,
  adminDeactivateUser,
  adminReactivateUser,
  adminPromoteUser,
  adminDemoteUser,
  adminArchiveWorkspace,
  adminUnarchiveWorkspace,
  adminForceDeleteWorkspace,
  formatBytes,
  type AdminUser,
  type AdminUserDetail,
  type AdminWorkspace,
  type AuditEvent,
  type GlobalRole,
} from "@/lib/mock-admin";
