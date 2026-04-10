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

const buildDisabledItem = (id: string, label: string, description?: string): CommandPaletteItem => ({
  id,
  label,
  description,
  disabled: true,
});

export const buildCommandPaletteSearchGroups = ({
  onSelectUrl,
  search,
}: Readonly<{
  search: SearchResults;
  onSelectUrl: (url: string) => void;
}>) => {
  const documents = search.documents.slice(0, 5);
  const tasks = search.tasks.slice(0, 5);

  const groups: CommandPaletteGroup[] = [];

  if (documents.length > 0) {
    groups.push({
      id: "search-documents",
      label: "Documents",
      items: documents.map((result) => ({
        id: `doc-${result.id}`,
        label: result.title,
        description: stripSearchSnippetMarkup(result.snippet),
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
        label: result.title,
        description: stripSearchSnippetMarkup(result.snippet),
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
      items: [buildDisabledItem("search-empty", "No results found.")],
    },
  ];
};

export const buildCommandPaletteGroups = ({
  baseGroups,
  normalizedQuery,
  onSelectUrl,
  status,
}: Readonly<{
  baseGroups: readonly CommandPaletteGroup[];
  normalizedQuery: string;
  status: CommandPaletteSearchStatus;
  onSelectUrl: (url: string) => void;
}>) => {
  if (normalizedQuery.length < 2) {
    return [...baseGroups];
  }

  if (status.kind === "loading") {
    return [
      ...baseGroups,
      {
        id: "search-documents-loading",
        label: "Documents",
        items: [buildDisabledItem("search-documents-loading", "Searching documents...")],
      },
      {
        id: "search-tasks-loading",
        label: "Tasks",
        items: [buildDisabledItem("search-tasks-loading", "Searching tasks...")],
      },
    ];
  }

  if (status.kind === "error") {
    return [
      ...baseGroups,
      {
        id: "search-error",
        label: "Search",
        items: [
          buildDisabledItem(
            "search-error",
            status.message,
            status.requestId ? `Request id: ${status.requestId}` : undefined,
          ),
        ],
      },
    ];
  }

  if (status.kind === "loaded") {
    return [
      ...baseGroups,
      ...buildCommandPaletteSearchGroups({ search: status.results, onSelectUrl }),
    ];
  }

  return [...baseGroups];
};

export const toSearchStatusFromResponse = (response: SearchResponse): CommandPaletteSearchStatus => ({
  kind: "loaded",
  query: response.query,
  results: response.results,
});

