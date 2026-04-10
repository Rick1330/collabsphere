import type { SearchResponse, SearchResults, SearchScope } from "../../lib/api/search";
import type { CommandPaletteGroup, CommandPaletteItem } from "./command-palette";

export type CommandPaletteSearchStatus =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "loaded"; query: string; results: SearchResults }
  | { kind: "error"; query: string; message: string; requestId: string | null };

export const normalizeCommandPaletteQuery = (value: string) => value.trim().slice(0, 200);

export const getSearchScopeFromPathname = (
  pathname: string | null | undefined,
): { scope: SearchScope; workspaceId: string | null } => {
  if (!pathname || !pathname.startsWith("/w/")) {
    return { scope: "global", workspaceId: null };
  }

  const [, , workspaceId] = pathname.split("/");
  return workspaceId ? { scope: "workspace", workspaceId } : { scope: "global", workspaceId: null };
};

export const stripSearchSnippetMarkup = (value: string) =>
  value.replaceAll(/<\/?mark>/g, "");

const getWorkspaceScopePill = (scope?: SearchScope) => (scope === "workspace" ? "Workspace" : undefined);

const buildDisabledItem = (
  id: string,
  label: string,
  description?: string,
  options?: { icon?: CommandPaletteItem["icon"]; pill?: string },
): CommandPaletteItem => ({
  id,
  icon: options?.icon ?? "…",
  label,
  description,
  pill: options?.pill,
  disabled: true,
});

export const buildCommandPaletteSearchGroups = ({
  onSelectUrl,
  search,
  scope,
}: Readonly<{
  search: SearchResults;
  onSelectUrl: (url: string) => void;
  scope?: SearchScope;
}>) => {
  const documents = search.documents.slice(0, 5);
  const tasks = search.tasks.slice(0, 5);
  const pill = getWorkspaceScopePill(scope);

  const groups: CommandPaletteGroup[] = [];

  if (documents.length > 0) {
    groups.push({
      id: "search-documents",
      label: "Documents",
      items: documents.map((result) => ({
        id: `doc-${result.id}`,
        icon: "📄",
        label: result.title,
        description: stripSearchSnippetMarkup(result.snippet),
        pill,
        onSelect: () => {
          onSelectUrl(result.url);
        },
      })),
    });
  }

  if (tasks.length > 0) {
    groups.push({
      id: "search-tasks",
      label: "Tasks",
      items: tasks.map((result) => ({
        id: `task-${result.id}`,
        icon: "✅",
        label: result.title,
        description: stripSearchSnippetMarkup(result.snippet),
        pill,
        onSelect: () => {
          onSelectUrl(result.url);
        },
      })),
    });
  }

  if (groups.length > 0) {
    return groups;
  }

  return [
    {
      id: "search-empty",
      label: "Search",
      items: [buildDisabledItem("search-empty", "No results found.", undefined, { icon: "🔎" })],
    },
  ];
};

const buildCommandPaletteSearchStatusGroups = ({
  onSelectUrl,
  scope,
  status,
}: Readonly<{
  status: CommandPaletteSearchStatus;
  onSelectUrl: (url: string) => void;
  scope?: SearchScope;
}>) => {
  const pill = getWorkspaceScopePill(scope);

  if (status.kind === "loading") {
    return [
      {
        id: "search-documents-loading",
        label: "Documents",
        items: [
          buildDisabledItem("search-documents-loading", "Searching documents...", undefined, {
            icon: "⏳",
            pill,
          }),
        ],
      },
      {
        id: "search-tasks-loading",
        label: "Tasks",
        items: [
          buildDisabledItem("search-tasks-loading", "Searching tasks...", undefined, { icon: "⏳", pill }),
        ],
      },
    ] satisfies CommandPaletteGroup[];
  }

  if (status.kind === "error") {
    return [
      {
        id: "search-error",
        label: "Search",
        items: [
          buildDisabledItem(
            "search-error",
            status.message,
            status.requestId ? `Request id: ${status.requestId}` : undefined,
            { icon: "⚠️" },
          ),
        ],
      },
    ] satisfies CommandPaletteGroup[];
  }

  if (status.kind === "loaded") {
    return buildCommandPaletteSearchGroups({ search: status.results, onSelectUrl, scope });
  }

  return [];
};

export const buildCommandPaletteGroups = ({
  baseGroups,
  normalizedQuery,
  onSelectUrl,
  scope,
  status,
}: Readonly<{
  baseGroups: readonly CommandPaletteGroup[];
  normalizedQuery: string;
  status: CommandPaletteSearchStatus;
  onSelectUrl: (url: string) => void;
  scope?: SearchScope;
}>) => {
  if (normalizedQuery.length < 2) {
    return [...baseGroups];
  }

  return [
    ...baseGroups,
    ...buildCommandPaletteSearchStatusGroups({ status, onSelectUrl, scope }),
  ];
};

export const toSearchStatusFromResponse = (response: SearchResponse): CommandPaletteSearchStatus => ({
  kind: "loaded",
  query: response.query,
  results: response.results,
});

