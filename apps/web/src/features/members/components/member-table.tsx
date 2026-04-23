import { Crown, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fullDateTime,
  getAvatarColor,
  getInitials,
  relativeTime,
} from "@/lib/format";
import {
  getAssignableRoles,
  getRoleLabel,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/api/adapters/members";

interface MemberTableProps {
  members: WorkspaceMember[];
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  canManage: boolean;
  onRoleChange: (member: WorkspaceMember, nextRole: WorkspaceRole) => void;
  onRemove: (member: WorkspaceMember) => void;
}

export const MemberTable = ({
  members,
  currentUserId,
  currentUserRole,
  canManage,
  onRoleChange,
  onRemove,
}: MemberTableProps) => {
  const assignable = getAssignableRoles(currentUserRole);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hidden md:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/70">
            <th className="text-left px-4 py-2.5 w-[40%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400">
              Member
            </th>
            <th className="text-left px-4 py-2.5 w-[20%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400">
              Role
            </th>
            <th className="text-left px-4 py-2.5 w-[20%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400">
              Joined
            </th>
            {canManage && (
              <th className="text-right px-4 py-2.5 w-[20%] font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isOwner = member.role === "OWNER";
            const isSelf = member.user.id === currentUserId;
            const showSelect = canManage && !isOwner && !isSelf;
            const currentRoleAssignable = assignable.includes(member.role);

            return (
              <tr
                key={member.membershipId}
                className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors duration-100"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: getAvatarColor(member.user.id) }}
                      aria-hidden="true"
                    >
                      {getInitials(member.user.fullName, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900 truncate">
                          {member.user.fullName}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 truncate block">
                        {member.user.email}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      <Crown className="h-3 w-3" aria-hidden="true" />
                      Owner
                    </span>
                  ) : showSelect ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        onRoleChange(member, e.target.value as WorkspaceRole)
                      }
                      className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[11px] font-mono tracking-wider uppercase text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
                      aria-label={`Change role for ${member.user.fullName}`}
                    >
                      {assignable.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                      {!currentRoleAssignable && (
                        <option value={member.role} disabled>
                          {getRoleLabel(member.role)}
                        </option>
                      )}
                    </select>
                  ) : (
                    <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                      {member.roleLabel}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <time
                    dateTime={member.joinedAt}
                    title={fullDateTime(member.joinedAt)}
                    className="font-mono text-[10px] text-stone-400 tracking-wider"
                  >
                    {relativeTime(member.joinedAt)}
                  </time>
                </td>

                {canManage && (
                  <td className="px-4 py-3 text-right">
                    {!isOwner && !isSelf ? (
                      <button
                        onClick={() => onRemove(member)}
                        className={cn(
                          "h-7 px-2.5 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 ml-auto",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
                        )}
                      >
                        <UserMinus className="h-3 w-3" aria-hidden="true" />
                        Remove
                      </button>
                    ) : isOwner ? (
                      <span className="font-mono text-[10px] text-stone-300 tracking-wider">
                        —
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-stone-300 tracking-wider italic">
                        (you)
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
