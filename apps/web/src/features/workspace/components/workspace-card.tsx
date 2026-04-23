import { Link } from "react-router-dom";
import {
  CheckSquare,
  FileText,
  Users,
  MoreHorizontal,
  ExternalLink,
  Settings as SettingsIcon,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVATAR_COLORS,
  getInitials,
  relativeTime,
  fullDateTime,
} from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WorkspaceType = "professional" | "academic" | "general";
export type WorkspaceStatus = "active" | "archived";

export interface WorkspaceMember {
  id: string;
  fullName: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  icon?: string;
  docs: number;
  tasks: number;
  memberCount: number;
  recentMembers: WorkspaceMember[];
  roleLabel: string;
  lastAccessedAt: string;
  isAdminOrOwner: boolean;
}

interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
  onArchive?: (workspace: WorkspaceSummary) => void;
  onUnarchive?: (workspace: WorkspaceSummary) => void;
}

export const WorkspaceCard = ({
  workspace,
  onArchive,
  onUnarchive,
}: WorkspaceCardProps) => {
  const isArchived = workspace.status === "archived";
  const { isAdminOrOwner } = workspace;

  return (
    <Link
      to={`/w/${workspace.id}`}
      aria-label={`Open workspace ${workspace.name}${isArchived ? " (archived)" : ""}`}
      className={cn(
        "group relative block rounded-xl bg-white p-5 shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2",
        isArchived
          ? "border border-dashed border-amber-300/50 opacity-70 hover:opacity-90"
          : "border border-stone-200 hover:border-stone-300",
      )}
    >
      {isArchived && <span className="sr-only">Archived workspace</span>}

      {/* LAYER 1 — Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
              "transition-transform duration-200 motion-safe:group-hover:scale-105 border",
              workspace.type === "professional" &&
                "bg-teal-50 text-teal-700 border-teal-200",
              workspace.type === "academic" &&
                "bg-amber-50 text-amber-700 border-amber-200",
              workspace.type === "general" &&
                "bg-stone-100 text-stone-600 border-stone-200",
            )}
            aria-hidden="true"
          >
            {workspace.icon || getInitials(workspace.name, 2)}
          </div>
          <div className="min-w-0">
            <h3
              className={cn(
                "text-sm font-semibold text-stone-900 truncate transition-colors duration-200",
                !isArchived && "group-hover:text-teal-700",
              )}
            >
              {workspace.name}
            </h3>
            {isArchived ? (
              <p className="text-xs text-amber-700/80 italic truncate mt-0.5">
                archived — read-only
              </p>
            ) : (
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {workspace.description || "No description"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={cn(
              "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border",
              workspace.type === "professional" &&
                "bg-teal-50 text-teal-600 border-teal-200",
              workspace.type === "academic" &&
                "bg-amber-50 text-amber-600 border-amber-200",
              workspace.type === "general" &&
                "bg-stone-100 text-stone-500 border-stone-200",
            )}
          >
            {workspace.type}
          </span>
          {isArchived && (
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300">
              ARCHIVED
            </span>
          )}

          {/* Action menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label={`Actions for ${workspace.name}`}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100",
                  "transition-opacity duration-150",
                  "opacity-0 group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link
                  to={`/w/${workspace.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open workspace
                </Link>
              </DropdownMenuItem>
              {isAdminOrOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={`/settings`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <SettingsIcon className="h-3.5 w-3.5" />
                      Workspace settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isArchived ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onArchive?.(workspace);
                      }}
                      className="flex items-center gap-2 text-amber-600 focus:text-amber-600"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive workspace
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onUnarchive?.(workspace);
                      }}
                      className="flex items-center gap-2"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      Unarchive workspace
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* LAYER 2 — Pulse */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
        <Stat icon={FileText} value={workspace.docs} label="docs" />
        <Stat icon={CheckSquare} value={workspace.tasks} label="tasks" />
        <Stat icon={Users} value={workspace.memberCount} label="members" />
        <div className="flex-1" />
        <time
          dateTime={workspace.lastAccessedAt}
          title={fullDateTime(workspace.lastAccessedAt)}
          className="font-mono text-[10px] text-stone-400 tracking-wider"
        >
          {relativeTime(workspace.lastAccessedAt)}
        </time>
      </div>

      {/* LAYER 3 — People */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex -space-x-1.5">
          {workspace.recentMembers.slice(0, 4).map((m, i) => (
            <div
              key={m.id}
              className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
              style={{
                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                color: "white",
                zIndex: 4 - i,
              }}
              title={m.fullName}
              aria-hidden="true"
            >
              {getInitials(m.fullName, 1)}
            </div>
          ))}
          {workspace.memberCount > 4 && (
            <div
              className="h-6 w-6 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[9px] font-medium text-stone-500"
              style={{ zIndex: 0 }}
              title={`${workspace.memberCount - 4} more members`}
              aria-hidden="true"
            >
              +{workspace.memberCount - 4}
            </div>
          )}
        </div>
        <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase">
          {workspace.roleLabel}
        </span>
      </div>
    </Link>
  );
};

const Stat = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) => (
  <div className="flex items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 text-stone-400" />
    <span className="text-xs text-stone-500">
      <span className="font-medium text-stone-700">{value}</span> {label}
    </span>
  </div>
);
