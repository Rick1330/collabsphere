/**
 * Workspace switcher — top-nav popover.
 *
 * Combines seeded workspaces with user-created (stored) workspaces, supports
 * keyboard search, groups by type, marks the active one (derived from URL),
 * and exposes quick actions (settings, create new, browse all).
 */

import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Check,
  ChevronsUpDown,
  Cog,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  StickyNote,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStoredWorkspaces, workspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WSType = "professional" | "academic" | "general";

interface WSItem {
  id: string;
  name: string;
  type: WSType;
  description?: string;
  roleLabel?: string;
  seeded?: boolean;
}

const SEEDED: WSItem[] = [
  {
    id: "alpha",
    name: "Project Alpha",
    type: "professional",
    description: "Product launch · Q3",
    roleLabel: "OWNER",
    seeded: true,
  },
  {
    id: "thesis",
    name: "Thesis — Distributed Systems",
    type: "academic",
    description: "Research notebook",
    roleLabel: "EDITOR",
    seeded: true,
  },
  {
    id: "personal",
    name: "Personal Notes",
    type: "general",
    description: "Drafts & journal",
    roleLabel: "OWNER",
    seeded: true,
  },
];

const TYPE_META: Record<
  WSType,
  { label: string; icon: typeof Briefcase; tone: string; dot: string }
> = {
  professional: {
    label: "Professional",
    icon: Briefcase,
    tone: "text-teal-700 bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
  },
  academic: {
    label: "Academic",
    icon: GraduationCap,
    tone: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  general: {
    label: "General",
    icon: StickyNote,
    tone: "text-stone-700 bg-stone-100 border-stone-200",
    dot: "bg-stone-400",
  },
};

const initials = (name: string) =>
  name
    .split(/[\s—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "W";

export const WorkspaceSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stored = useStoredWorkspaces();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Merge stored + seeded (stored take precedence on id collision)
  const items: WSItem[] = useMemo(() => {
    const storedItems: WSItem[] = stored
      .filter((w) => w.status === "active")
      .map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        description: w.description || w.templateName || "Workspace",
        roleLabel: w.roleLabel,
      }));
    const storedIds = new Set(storedItems.map((w) => w.id));
    const merged = [...storedItems, ...SEEDED.filter((s) => !storedIds.has(s.id))];
    return merged;
  }, [stored]);

  // Active workspace from URL (e.g. /w/thesis/...)
  const activeId = useMemo(() => {
    const m = location.pathname.match(/^\/w\/([^/]+)/);
    return m?.[1] ?? null;
  }, [location.pathname]);

  const active = items.find((w) => w.id === activeId) ?? items[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q) ||
        (w.description?.toLowerCase().includes(q) ?? false),
    );
  }, [items, query]);

  // Group by type, preserve order: professional, academic, general
  const grouped = useMemo(() => {
    const order: WSType[] = ["professional", "academic", "general"];
    return order
      .map((type) => ({
        type,
        items: filtered.filter((w) => w.type === type),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const handlePick = (w: WSItem) => {
    workspaceStore.touch(w.id);
    setOpen(false);
    setQuery("");
    navigate(`/w/${w.id}`);
  };

  if (!active) {
    return (
      <Link
        to="/workspaces/new"
        className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50 border border-teal-200 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create workspace
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "hidden sm:flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg text-sm",
            "text-stone-700 hover:bg-stone-100 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
            open && "bg-stone-100",
          )}
          aria-label="Switch workspace"
          aria-expanded={open}
        >
          <span
            className={cn(
              "h-6 w-6 rounded-md text-white text-[10px] font-bold flex items-center justify-center shadow-sm",
              active.type === "professional" && "bg-gradient-to-br from-teal-500 to-teal-700",
              active.type === "academic" && "bg-gradient-to-br from-amber-500 to-amber-700",
              active.type === "general" && "bg-gradient-to-br from-stone-500 to-stone-700",
            )}
          >
            {initials(active.name)}
          </span>
          <span className="flex flex-col items-start leading-tight min-w-0">
            <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
              Workspace
            </span>
            <span className="font-semibold text-stone-800 truncate max-w-[160px]">
              {active.name}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-stone-400 ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[340px] p-0 bg-white border-stone-200 shadow-xl rounded-xl overflow-hidden"
      >
        {/* Search */}
        <div className="px-3 pt-3 pb-2 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search workspaces…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-2 rounded-md text-sm bg-stone-50 border border-stone-200 placeholder:text-stone-400 text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-300"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-stone-500">
              <Sparkles className="h-5 w-5 mx-auto mb-2 text-stone-300" />
              No workspaces match “{query}”
            </div>
          ) : (
            grouped.map(({ type, items: groupItems }) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <div key={type} className="px-1.5 pt-1.5 pb-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono tracking-[0.12em] uppercase text-stone-400">
                    <Icon className="h-3 w-3" />
                    {meta.label}
                    <span className="ml-1 text-stone-300">·</span>
                    <span className="text-stone-400">{groupItems.length}</span>
                  </div>
                  {groupItems.map((w) => {
                    const isActive = w.id === active.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handlePick(w)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors group",
                          isActive ? "bg-teal-50/60" : "hover:bg-stone-50",
                        )}
                      >
                        <span
                          className={cn(
                            "h-8 w-8 rounded-md text-white text-[11px] font-bold flex items-center justify-center shadow-sm flex-shrink-0",
                            w.type === "professional" && "bg-gradient-to-br from-teal-500 to-teal-700",
                            w.type === "academic" && "bg-gradient-to-br from-amber-500 to-amber-700",
                            w.type === "general" && "bg-gradient-to-br from-stone-500 to-stone-700",
                          )}
                        >
                          {initials(w.name)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-sm font-medium truncate",
                                isActive ? "text-teal-800" : "text-stone-800",
                              )}
                            >
                              {w.name}
                            </span>
                            {w.roleLabel && (
                              <span className="text-[9px] font-mono tracking-wider px-1 py-px rounded bg-stone-100 text-stone-500 uppercase flex-shrink-0">
                                {w.roleLabel}
                              </span>
                            )}
                          </span>
                          {w.description && (
                            <span className="block text-[11px] text-stone-500 truncate">
                              {w.description}
                            </span>
                          )}
                        </span>
                        {isActive ? (
                          <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        ) : (
                          <span
                            className={cn("h-2 w-2 rounded-full flex-shrink-0", meta.dot)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-stone-100 p-1.5 flex items-center gap-1 bg-stone-50/60">
          <Link
            to="/workspaces/new"
            onClick={() => setOpen(false)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md text-xs font-medium text-teal-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New workspace
          </Link>
          <Link
            to="/workspaces"
            onClick={() => setOpen(false)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md text-xs font-medium text-stone-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 transition-all"
          >
            Browse all
          </Link>
          {active && (
            <Link
              to={`/w/${active.id}/settings`}
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-stone-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 hover:text-stone-800 transition-all"
              title="Workspace settings"
              aria-label="Workspace settings"
            >
              <Cog className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
