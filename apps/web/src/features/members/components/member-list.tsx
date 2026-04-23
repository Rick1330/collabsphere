import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Crown,
  Lock,
  RefreshCw,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fullDateTime, relativeTime } from "@/lib/format";
import {
  PageHeader,
  CountChip,
  MetaStat,
  MetaDivider,
} from "@/components/shared/page-header";
import {
  changeMemberRole,
  fetchMembers,
  fetchPendingInvitations,
  removeMember,
  revokeInvitation,
  inviteMember,
  sortMembers,
  type ApiError,
  type PendingInvitation,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/api/adapters/members";
import { MemberTable } from "./member-table";
import { MemberCard } from "./member-card";
import { InviteDialog } from "./invite-dialog";

interface MemberListProps {
  workspaceId: string;
  workspaceName: string;
  workspaceStatus: "active" | "archived";
  currentUserId: string;
  currentUserRole: WorkspaceRole;
}

export const MemberList = ({
  workspaceId,
  workspaceName,
  workspaceStatus,
  currentUserId,
  currentUserRole,
}: MemberListProps) => {
  const queryClient = useQueryClient();
  const isArchived = workspaceStatus === "archived";
  const canManage =
    !isArchived &&
    (currentUserRole === "OWNER" || currentUserRole === "ADMIN");
  const canInvite = canManage;

  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["workspace", workspaceId, "members"],
    queryFn: () => fetchMembers(workspaceId),
  });

  const invitationsQuery = useQuery({
    queryKey: ["workspace", workspaceId, "invitations"],
    queryFn: () => fetchPendingInvitations(workspaceId),
    enabled: canManage,
  });

  const sortedMembers = useMemo(
    () => sortMembers(membersQuery.data?.data.items ?? []),
    [membersQuery.data],
  );
  const invitations = invitationsQuery.data?.data.items ?? [];

  // Composition stats for governance meta strip
  const composition = useMemo(() => {
    const c: Record<WorkspaceRole, number> = {
      OWNER: 0,
      ADMIN: 0,
      MANAGER: 0,
      MEMBER: 0,
      VIEWER: 0,
    };
    for (const m of sortedMembers) c[m.role] += 1;
    return c;
  }, [sortedMembers]);

  const refetchMembers = () =>
    queryClient.invalidateQueries({
      queryKey: ["workspace", workspaceId, "members"],
    });
  const refetchInvitations = () =>
    queryClient.invalidateQueries({
      queryKey: ["workspace", workspaceId, "invitations"],
    });

  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    try {
      await changeMemberRole(workspaceId, member.membershipId, newRole);
      refetchMembers();
      toast.success(`${member.user.fullName}'s role updated to ${newRole}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.code === "CANNOT_DEMOTE_OWNER") {
        toast.error("Cannot change the Owner's role.");
      } else if (apiErr?.code === "FORBIDDEN_ROLE_ASSIGNMENT") {
        toast.error("You don't have permission to assign this role.");
      } else {
        toast.error("Failed to update role.");
      }
      refetchMembers();
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (
      !confirm(
        `Remove ${member.user.fullName} from this workspace?\n\nThey will lose access to all workspace content.`,
      )
    )
      return;
    try {
      await removeMember(workspaceId, member.membershipId);
      refetchMembers();
      toast.success(`${member.user.fullName} removed`);
    } catch (err) {
      if ((err as ApiError)?.code === "CANNOT_REMOVE_OWNER") {
        toast.error("Cannot remove the workspace Owner. Transfer ownership first.");
      } else {
        toast.error("Failed to remove member.");
      }
    }
  };

  const handleResendInvite = async (inv: PendingInvitation) => {
    try {
      await inviteMember(workspaceId, { email: inv.email, role: inv.role });
      refetchInvitations();
      toast.success(`Invitation resent to ${inv.email}`);
    } catch (err) {
      const code = (err as ApiError)?.code;
      if (code === "INVITATION_RESEND_RATE_LIMITED") {
        toast.error("Invitation was resent recently. Try again in 24 hours.");
      } else if (code === "WORKSPACE_ARCHIVED") {
        toast.error("Workspace is archived. Restore it to resend invitations.");
      } else {
        toast.error("Failed to resend invitation.");
      }
    }
  };

  const handleRevokeInvite = async (inv: PendingInvitation) => {
    if (!confirm(`Revoke invitation to ${inv.email}?`)) return;
    try {
      await revokeInvitation(workspaceId, inv.id);
      refetchInvitations();
      toast.success("Invitation revoked");
    } catch {
      toast.error("Failed to revoke invitation.");
    }
  };

  const isLoading = membersQuery.isLoading;
  const isError = membersQuery.isError;
  const isEmpty = !isLoading && !isError && sortedMembers.length <= 1;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          variant="contextual"
          eyebrow="Governance"
          title="Members"
          description={
            isArchived
              ? "This workspace is archived. Membership is read-only."
              : "Roles, invitations, and access for everyone in this workspace."
          }
          icon={<Users className="h-5 w-5 text-stone-700" aria-hidden="true" />}
          badges={
            <>
              <CountChip
                value={sortedMembers.length}
                tone="neutral"
                label="total members"
              />
              {isArchived && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Read-only
                </span>
              )}
            </>
          }
          actions={
            canInvite ? (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="h-9 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-sm font-medium text-white transition-colors flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/40"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Invite members</span>
              </button>
            ) : null
          }
          meta={
            membersQuery.data ? (
              <>
                <MetaStat
                  label="workspace"
                  value={workspaceName}
                />
                <MetaDivider />
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-3 w-3 text-amber-500" aria-hidden="true" />
                  <span className="font-medium text-stone-700 tabular-nums">
                    {composition.OWNER}
                  </span>
                  <span className="text-stone-500">owner</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-stone-400" aria-hidden="true" />
                  <span className="font-medium text-stone-700 tabular-nums">
                    {composition.ADMIN + composition.MANAGER}
                  </span>
                  <span className="text-stone-500">managers</span>
                </span>
                <MetaStat
                  label="contributors"
                  value={composition.MEMBER + composition.VIEWER}
                />
                {invitations.length > 0 && (
                  <>
                    <MetaDivider />
                    <MetaStat label="pending invites" value={invitations.length} />
                  </>
                )}
              </>
            ) : null
          }
        />

        {/* Loading */}
        {isLoading && (
          <div aria-busy="true" className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hidden md:block">
              <div className="border-b border-stone-200 bg-stone-50/70 h-9" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-stone-100 last:border-b-0 px-4 py-3 flex items-center gap-3"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ))}
            </div>
            <div className="space-y-3 md:hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-stone-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50/50 p-6 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-red-900">
                Couldn't load members
              </h2>
              <p className="text-sm text-red-700 mt-1">
                Something went wrong loading the workspace member list.
              </p>
              <button
                onClick={() => membersQuery.refetch()}
                className="mt-3 h-8 px-3 rounded-md text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty (just the current user) */}
        {!isLoading && !isError && isEmpty && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="p-8 sm:p-10">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400">
                  Solo workspace
                </p>
                <h2 className="text-xl font-semibold text-stone-900 mt-2 tracking-tight">
                  Bring teammates in
                </h2>
                <p className="text-sm text-stone-500 mt-2 max-w-md leading-relaxed">
                  Workspaces are most useful with collaborators. Invite people by email
                  and assign one of five roles — from full Admin down to read-only Viewer.
                </p>
                {canInvite && (
                  <button
                    onClick={() => setShowInviteDialog(true)}
                    className="mt-6 h-9 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-sm font-medium text-white inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Invite your first teammate
                  </button>
                )}
              </div>
              <div className="bg-stone-50 border-t md:border-t-0 md:border-l border-stone-200 p-6 sm:p-8">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-3">
                  The five roles
                </p>
                <ul className="space-y-2 text-[12.5px]">
                  <li className="flex items-center gap-2 text-stone-700">
                    <Crown className="h-3.5 w-3.5 text-amber-500" /> Owner — full control
                  </li>
                  <li className="flex items-center gap-2 text-stone-700">
                    <Shield className="h-3.5 w-3.5 text-stone-500" /> Admin — manage settings + members
                  </li>
                  <li className="flex items-center gap-2 text-stone-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    Manager — manage tasks + reviews
                  </li>
                  <li className="flex items-center gap-2 text-stone-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                    Member — create + edit
                  </li>
                  <li className="flex items-center gap-2 text-stone-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    Viewer — read-only
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Loaded */}
        {!isLoading && !isError && !isEmpty && (
          <>
            <MemberTable
              members={sortedMembers}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canManage={canManage}
              onRoleChange={handleRoleChange}
              onRemove={handleRemoveMember}
            />
            <div className="space-y-3 md:hidden">
              {sortedMembers.map((m) => (
                <MemberCard
                  key={m.membershipId}
                  member={m}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  canManage={canManage}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemoveMember}
                />
              ))}
            </div>
          </>
        )}

        {/* Pending invitations */}
        {canManage && invitations.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-500">
                Pending invitations
              </h2>
              <span className="font-mono text-[10px] tabular-nums tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {invitations.length}
              </span>
              <div className="h-px flex-1 bg-stone-200" aria-hidden="true" />
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-50/30 to-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-amber-200/60 bg-amber-50/40">
                      <th className="text-left px-4 py-2.5 w-[30%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-500">
                        Email
                      </th>
                      <th className="text-left px-4 py-2.5 w-[15%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-500">
                        Role
                      </th>
                      <th className="text-left px-4 py-2.5 w-[20%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-500">
                        Invited by
                      </th>
                      <th className="text-left px-4 py-2.5 w-[15%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-500">
                        Expires
                      </th>
                      <th className="text-right px-4 py-2.5 w-[20%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) < new Date();
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-stone-100 last:border-b-0 hover:bg-white transition-colors duration-100"
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm text-stone-900 font-medium">{inv.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">
                              {inv.roleLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-stone-500">
                              {inv.invitedBy.fullName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <time
                              dateTime={inv.expiresAt}
                              title={fullDateTime(inv.expiresAt)}
                              className={cn(
                                "font-mono text-[10px] tracking-wider tabular-nums",
                                isExpired
                                  ? "text-red-600 font-semibold"
                                  : "text-stone-500",
                              )}
                            >
                              {isExpired
                                ? "EXPIRED"
                                : relativeTime(inv.expiresAt).toUpperCase()}
                            </time>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleResendInvite(inv)}
                                className="h-7 px-2 rounded-md text-[11px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                Resend
                              </button>
                              <button
                                onClick={() => handleRevokeInvite(inv)}
                                className="h-7 px-2 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      <InviteDialog
        workspaceId={workspaceId}
        currentUserRole={currentUserRole}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvited={refetchMembers}
      />
    </div>
  );
};
