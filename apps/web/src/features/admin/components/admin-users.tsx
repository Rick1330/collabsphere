import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAdminUsers,
  adminDeactivateUser,
  adminReactivateUser,
  adminPromoteUser,
  type AdminUser,
} from "@/api/adapters/admin";
import { fullDateTime, getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminTableShell,
  AdminTH,
  AdminTR,
  AdminTD,
  SeverityChip,
} from "./admin-primitives";

const PAGE_SIZE = 25;
type StatusFilter = "all" | "active" | "deactivated";
type RoleFilter = "all" | "ADMIN" | "USER";

export const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    document.title = "Users — Admin — CollabSphere";
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () => fetchAdminUsers({ search, page, pageSize: PAGE_SIZE }),
  });

  const items = data?.data.items ?? [];
  const pagination = data?.meta.pagination;

  // Client-side facet filters (status, role) on top of server search/page.
  const filteredItems = useMemo(() => {
    return items.filter((u) => {
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "deactivated" && u.isActive) return false;
      if (roleFilter !== "all" && u.globalRole !== roleFilter) return false;
      return true;
    });
  }, [items, statusFilter, roleFilter]);

  const handleDeactivate = async (user: AdminUser) => {
    if (!confirm(`Deactivate ${user.fullName}? They will lose access.`)) return;
    try {
      await adminDeactivateUser(user.id);
      await refetch();
      toast.success(`${user.fullName} deactivated`);
    } catch {
      toast.error("Failed to deactivate user.");
    }
  };

  const handleReactivate = async (user: AdminUser) => {
    try {
      await adminReactivateUser(user.id);
      await refetch();
      toast.success(`${user.fullName} reactivated`);
    } catch {
      toast.error("Failed to reactivate user.");
    }
  };

  const handlePromote = async (user: AdminUser) => {
    if (
      !confirm(
        `Promote ${user.fullName} to Platform Admin? They will have full admin access.`,
      )
    )
      return;
    try {
      await adminPromoteUser(user.id);
      await refetch();
      toast.success(`${user.fullName} promoted to Admin`);
    } catch {
      toast.error("Failed to promote user.");
    }
  };

  const lastUpdated = data
    ? new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : undefined;

  return (
    <div>
      <AdminPageHeader
        eyebrow="OPERATIONS · USERS"
        title="User management"
        description="Search, filter, and operate on platform accounts. All actions are audited."
        lastUpdated={lastUpdated}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {isLoading && (
        <div className="space-y-1.5" aria-busy="true">
          <Skeleton className="h-9 w-full rounded-lg" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center"
        >
          <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
          <p className="text-[13px] font-semibold text-stone-900 mt-2">
            Couldn't load users
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <AdminTableShell
            caption="Platform users"
            minWidth={920}
            toolbar={
              <>
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-7 pl-8 pr-2.5 rounded-md text-[12px] bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
                    aria-label="Search users"
                  />
                </div>
                <FacetGroup
                  label="Status"
                  options={[
                    { v: "all", l: "All" },
                    { v: "active", l: "Active" },
                    { v: "deactivated", l: "Deactivated" },
                  ]}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as StatusFilter)}
                />
                <FacetGroup
                  label="Role"
                  options={[
                    { v: "all", l: "All" },
                    { v: "ADMIN", l: "Admin" },
                    { v: "USER", l: "User" },
                  ]}
                  value={roleFilter}
                  onChange={(v) => setRoleFilter(v as RoleFilter)}
                />
              </>
            }
            summary={
              <>
                <span className="font-mono text-[10px] tracking-wider tabular-nums">
                  {filteredItems.length} SHOWN
                </span>
                {pagination && (
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                    · {pagination.totalItems.toLocaleString()} TOTAL
                  </span>
                )}
              </>
            }
            head={
              <tr>
                <AdminTH>User</AdminTH>
                <AdminTH>Role</AdminTH>
                <AdminTH>Status</AdminTH>
                <AdminTH>Provider</AdminTH>
                <AdminTH>Joined</AdminTH>
                <AdminTH>Last login</AdminTH>
                <AdminTH align="right">Actions</AdminTH>
              </tr>
            }
          >
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-stone-900">
                    No users match these filters
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Clear search or facet filters to see more.
                  </p>
                </td>
              </tr>
            ) : (
              filteredItems.map((user) => (
                <AdminTR key={user.id}>
                  <AdminTD>
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: getAvatarColor(user.id) }}
                      >
                        {getInitials(user.fullName, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-stone-900 truncate group-hover:text-red-700 transition-colors">
                          {user.fullName}
                        </p>
                        <p className="font-mono text-[10px] text-stone-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </Link>
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={user.globalRole === "ADMIN" ? "admin" : "neutral"}
                    >
                      {user.globalRole}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={user.isActive ? "success" : "error"}
                      dot
                    >
                      {user.isActive ? "ACTIVE" : "DEACTIVATED"}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={user.authProvider === "google" ? "google" : "neutral"}
                    >
                      {user.authProvider}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD mono>
                    <time
                      dateTime={user.createdAt}
                      title={fullDateTime(user.createdAt)}
                    >
                      {relativeTime(user.createdAt)}
                    </time>
                  </AdminTD>
                  <AdminTD mono>
                    {user.lastLoginAt ? (
                      <time
                        dateTime={user.lastLoginAt}
                        title={fullDateTime(user.lastLoginAt)}
                      >
                        {relativeTime(user.lastLoginAt)}
                      </time>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </AdminTD>
                  <AdminTD align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-6 w-6 rounded flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-auto"
                          aria-label={`Actions for ${user.fullName}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-500" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(user)}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleReactivate(user)}
                            className="flex items-center gap-2"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-stone-500" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        {user.globalRole === "USER" && (
                          <DropdownMenuItem
                            onClick={() => handlePromote(user)}
                            className="flex items-center gap-2"
                          >
                            <ShieldPlus className="h-3.5 w-3.5 text-stone-500" />
                            Promote to Admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTD>
                </AdminTR>
              ))
            )}
          </AdminTableShell>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="User list pagination"
              className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3"
            >
              <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                PAGE {pagination.page} / {pagination.totalPages} ·{" "}
                {pagination.totalItems.toLocaleString()} USERS
              </span>
              <div className="flex items-center gap-1.5">
                <PageButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Prev
                </PageButton>
                <PageButton
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages || isFetching}
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </PageButton>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

const FacetGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ v: string; l: string }>;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-1.5" role="group" aria-label={label}>
    <span className="font-mono text-[9px] text-stone-400 tracking-[0.14em] uppercase">
      {label}
    </span>
    <div className="flex">
      {options.map((opt, i) => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          aria-pressed={value === opt.v}
          className={cn(
            "h-7 px-2 text-[11px] font-medium border border-stone-200 transition-colors",
            i === 0 && "rounded-l-md",
            i === options.length - 1 && "rounded-r-md",
            i > 0 && "border-l-0",
            value === opt.v
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-stone-600 hover:bg-stone-50",
          )}
        >
          {opt.l}
        </button>
      ))}
    </div>
  </div>
);

const PageButton = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-7 px-2.5 rounded-md border border-stone-200 bg-white text-[11px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
  >
    {children}
  </button>
);
