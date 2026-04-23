/**
 * Members API adapter.
 *
 * Canonical surface for everything member/invitation-related the UI needs:
 *  - async data reads (members, pending invitations)
 *  - mutating operations (invite, change role, remove, revoke)
 *  - shared TYPES (WorkspaceRole, WorkspaceMember, PendingInvitation)
 *  - role policy helpers (assignable roles, role labels/descriptions)
 *
 * Components and pages MUST import from this module rather than from
 * `@/lib/mock-members`. The mock file is the implementation detail that
 * lives behind this adapter; once a real backend lands, only this file
 * changes.
 */
export {
  fetchMembers,
  fetchPendingInvitations,
  inviteMember,
  changeMemberRole,
  removeMember,
  revokeInvitation,
  sortMembers,
  getAssignableRoles,
  getRoleLabel,
  getRoleDescription,
  ROLE_LABELS,
  type WorkspaceRole,
  type WorkspaceMember,
  type PendingInvitation,
  type ApiError,
} from "@/lib/mock-members";
