import { getInitials } from "@/lib/format";

export interface PresenceUser {
  id: string;
  fullName: string;
  color: string;
}

interface EditorPresenceProps {
  users: PresenceUser[];
}

export const EditorPresence = ({ users }: EditorPresenceProps) => {
  if (users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex -space-x-1.5"
        aria-label={`${users.length} ${users.length === 1 ? "person" : "people"} viewing`}
      >
        {visible.map((user, i) => (
          <div
            key={user.id}
            className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
            style={{ backgroundColor: user.color, zIndex: 4 - i }}
            title={user.fullName}
          >
            {getInitials(user.fullName, 1)}
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="h-6 w-6 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[9px] font-bold text-stone-600"
            style={{ zIndex: 0 }}
            title={`${overflow} more`}
          >
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[11px] text-stone-400 hidden lg:inline">
        {users.length === 1
          ? `${users[0].fullName.split(" ")[0]} viewing`
          : `${users.length} viewing`}
      </span>
    </div>
  );
};
