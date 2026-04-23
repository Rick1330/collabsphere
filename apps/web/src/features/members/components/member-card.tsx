import { Crown, UserMinus } from "lucide-react";
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

interface MemberCardProps {
  member: WorkspaceMember;
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  canManage: boolean;
  onRoleChange: (member: WorkspaceMember, nextRole: WorkspaceRole) => void;
  onRemove: (member: WorkspaceMember) => void;
}

export const MemberCard = ({
  member,
  currentUserId,
  currentUserRole,
  canManage,
  onRoleChange,
  onRemove,
}: MemberCardProps) => {
  const isOwner = member.role === "OWNER";
  const isSelf = member.user.id === currentUserId;
  const assignable = getAssignableRoles(currentUserRole);
  const showActions = canManage && !isOwner && !isSelf;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
            style={{ backgroundColor: getAvatarColor(member.user.id) }}
            aria-hidden="true"
          >
            {getInitials(member.user.fullName, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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

        {isOwner ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-50 text-amber-600 border border-amber-200">
            <Crown className="h-3 w-3" aria-hidden="true" />
            Owner
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 bg-stone-100 text-stone-500 border border-stone-200">
            {member.roleLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <time
          dateTime={member.joinedAt}
          title={fullDateTime(member.joinedAt)}
          className="font-mono text-[10px] text-stone-400 tracking-wider"
        >
          JOINED {relativeTime(member.joinedAt).toUpperCase()}
        </time>

        {showActions && (
          <div className="flex items-center gap-2">
            <select
              value={member.role}
              onChange={(e) => onRoleChange(member, e.target.value as WorkspaceRole)}
              className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[10px] font-mono tracking-wider uppercase text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
              aria-label={`Change role for ${member.user.fullName}`}
            >
              {assignable.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
              {!assignable.includes(member.role) && (
                <option value={member.role} disabled>
                  {getRoleLabel(member.role)}
                </option>
              )}
            </select>
            <button
              onClick={() => onRemove(member)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              aria-label={`Remove ${member.user.fullName}`}
            >
              <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
