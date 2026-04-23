import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ShieldMinus,
  ShieldPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAdminUserDetail,
  adminDeactivateUser,
  adminReactivateUser,
  adminPromoteUser,
  adminDemoteUser,
  type AdminUserDetail,
} from "@/api/adapters/admin";
import { getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminUserDetailViewProps {
  userId: string;
}

export const AdminUserDetailView = ({ userId }: AdminUserDetailViewProps) => {
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => fetchAdminUserDetail(userId),
    select: (r) => r.data,
  });

  useEffect(() => {
    document.title = `${user?.fullName ?? "User"} — Admin — CollabSphere`;
  }, [user?.fullName]);

  const handleDeactivate = async (u: AdminUserDetail) => {
    if (!confirm(`Deactivate ${u.fullName}? They will lose access.`)) return;
    try {
      await adminDeactivateUser(u.id);
      await refetch();
      toast.success(`${u.fullName} deactivated`);
    } catch {
      toast.error("Failed to deactivate user.");
    }
  };

  const handleReactivate = async (u: AdminUserDetail) => {
    try {
      await adminReactivateUser(u.id);
      await refetch();
      toast.success(`${u.fullName} reactivated`);
    } catch {
      toast.error("Failed to reactivate user.");
    }
  };

  const handlePromote = async (u: AdminUserDetail) => {
    if (
      !confirm(
        `Promote ${u.fullName} to Platform Admin? They will have full admin access.`,
      )
    )
      return;
    try {
      await adminPromoteUser(u.id);
      await refetch();
      toast.success(`${u.fullName} promoted to Admin`);
    } catch {
      toast.error("Failed to promote user.");
    }
  };

  const handleDemote = async (u: AdminUserDetail) => {
    if (!confirm(`Remove Admin role from ${u.fullName}?`)) return;
    try {
      await adminDemoteUser(u.id);
      await refetch();
      toast.success(`${u.fullName} is no longer an Admin`);
    } catch {
      toast.error("Failed to update user role.");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-stone-500 hover:text-red-700 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        All users
      </Link>
      <header className="border-b border-stone-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-[3px] bg-red-600 rounded-sm" aria-hidden="true" />
          <span className="font-mono text-[10px] text-red-700 tracking-[0.22em] uppercase">
            USER · DETAIL
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-stone-900 tracking-tight mt-2 truncate">
          {user?.fullName ?? "User detail"}
        </h1>
        <p className="text-[13px] text-stone-500 mt-1 truncate">
          {user?.email ?? "Loading…"}
        </p>
      </header>

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center"
        >
          <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-stone-900 mt-3">
            Couldn't load user details
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && user && (
        <>
          {/* Profile card */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0"
                style={{ backgroundColor: getAvatarColor(user.id) }}
              >
                {getInitials(user.fullName, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-stone-900">
                  {user.fullName}
                </p>
                <p className="text-sm text-stone-500">{user.email}</p>
                {user.bio && (
                  <p className="text-sm text-stone-500 mt-2">{user.bio}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                      user.globalRole === "ADMIN"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-stone-100 text-stone-500 border-stone-200",
                    )}
                  >
                    {user.globalRole}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                      user.isActive
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200",
                    )}
                  >
                    {user.isActive ? "ACTIVE" : "DEACTIVATED"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                      user.authProvider === "google"
                        ? "bg-sky-50 text-sky-600 border-sky-200"
                        : "bg-stone-100 text-stone-500 border-stone-200",
                    )}
                  >
                    {user.authProvider.toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                      user.isVerified
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-amber-50 text-amber-600 border-amber-200",
                    )}
                  >
                    {user.isVerified ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
              </div>
            </div>
            {/* Metadata */}
            <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-stone-100">
              <div>
                <span className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase block mb-1">
                  JOINED
                </span>
                <p className="text-sm text-stone-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase block mb-1">
                  LAST LOGIN
                </span>
                <p className="text-sm text-stone-900">
                  {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "Never"}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase block mb-1">
                  USER ID
                </span>
                <p className="font-mono text-xs text-stone-500">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Workspace memberships */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              Workspace memberships
              <span className="font-mono text-[10px] text-stone-400 tracking-wider bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-full">
                {user.workspaces.length}
              </span>
            </h2>
            {user.workspaces.length === 0 ? (
              <p className="text-sm text-stone-400 mt-3 italic">
                This user is not a member of any workspaces.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {user.workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors duration-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border shrink-0",
                          ws.type === "professional" &&
                            "bg-teal-50 text-teal-600 border-teal-200",
                          ws.type === "academic" &&
                            "bg-amber-50 text-amber-600 border-amber-200",
                          ws.type === "general" &&
                            "bg-stone-100 text-stone-500 border-stone-200",
                        )}
                      >
                        {ws.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-stone-900 truncate">
                        {ws.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase shrink-0 ml-3">
                      {ws.roleLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin actions */}
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
            <h2 className="text-sm font-semibold text-stone-900">
              Admin actions
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              These actions affect the user's access to the platform.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {user.isActive ? (
                <button
                  type="button"
                  onClick={() => handleDeactivate(user)}
                  className="h-8 px-3 rounded-lg border border-red-300 bg-white text-[12px] font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Deactivate account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReactivate(user)}
                  className="h-8 px-3 rounded-lg border border-emerald-300 bg-white text-[12px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Reactivate account
                </button>
              )}
              {user.globalRole === "USER" ? (
                <button
                  type="button"
                  onClick={() => handlePromote(user)}
                  className="h-8 px-3 rounded-lg border border-amber-300 bg-white text-[12px] font-medium text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                >
                  <ShieldPlus className="h-3.5 w-3.5" />
                  Promote to Admin
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDemote(user)}
                  className="h-8 px-3 rounded-lg border border-stone-300 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <ShieldMinus className="h-3.5 w-3.5" />
                  Remove Admin role
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
