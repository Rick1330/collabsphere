"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { SearchApiError, search, type SearchResults, type SearchScope } from "../../lib/api/search";
import {
  type CommandPaletteSearchStatus,
  normalizeCommandPaletteQuery,
} from "./command-palette-search-helpers";

type UseCommandPaletteSearchOptions = {
  query: string;
  scope: SearchScope;
  workspaceId: string | null;
};

const searchTypes = ["documents", "tasks"] as const;
const debounceMs = 200;

const idleStatus = (): CommandPaletteSearchStatus => ({ kind: "idle" });

const useDebouncedQuery = (query: string) => {
  const [debounced, setDebounced] = React.useState(query);

  React.useEffect(() => {
    if (query.length < 2) {
      setDebounced(query);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebounced(query);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return debounced;
};

export const useCommandPaletteSearch = ({
  query,
  scope,
  workspaceId,
}: Readonly<UseCommandPaletteSearchOptions>) => {
  const normalizedQuery = normalizeCommandPaletteQuery(query);
  const debouncedQuery = useDebouncedQuery(normalizedQuery);
  const hasWorkspaceScope = scope === "workspace";
  const hasWorkspaceId = Boolean(workspaceId);
  const enabled = debouncedQuery.length >= 2 && (!hasWorkspaceScope || hasWorkspaceId);

  const queryResult = useQuery({
    queryKey: [
      "command-palette-search",
      scope,
      hasWorkspaceScope ? workspaceId : null,
      debouncedQuery,
    ],
    enabled,
    queryFn: ({ signal }) => {
      if (scope === "workspace") {
        if (!workspaceId) {
          throw new SearchApiError(
            "validation",
            "Workspace ID is required for workspace-scoped search.",
          );
        }

        return search({
          q: debouncedQuery,
          scope: "workspace",
          workspaceId,
          signal,
          types: searchTypes,
          page: 1,
          pageSize: 25,
        });
      }

      return search({
        q: debouncedQuery,
        scope: "global",
        signal,
        types: searchTypes,
        page: 1,
        pageSize: 25,
      });
    },
  });

  const status = React.useMemo<CommandPaletteSearchStatus>(() => {
    if (normalizedQuery.length < 2) {
      return idleStatus();
    }

    if (hasWorkspaceScope && !hasWorkspaceId) {
      return idleStatus();
    }

    if (debouncedQuery !== normalizedQuery) {
      return { kind: "loading", query: normalizedQuery };
    }

    if (queryResult.isFetching) {
      return { kind: "loading", query: debouncedQuery };
    }

    if (queryResult.isError) {
      const error = queryResult.error;
      if (error instanceof SearchApiError) {
        return {
          kind: "error",
          query: debouncedQuery,
          message: error.message,
          requestId: error.requestId,
        };
      }

      return {
        kind: "error",
        query: debouncedQuery,
        message: "Search could not be completed.",
        requestId: null,
      };
    }

    if (queryResult.data) {
      return {
        kind: "loaded",
        query: queryResult.data.query,
        results: queryResult.data.results,
      };
    }

    return idleStatus();
  }, [
    debouncedQuery,
    hasWorkspaceId,
    hasWorkspaceScope,
    normalizedQuery,
    queryResult.data,
    queryResult.error,
    queryResult.isError,
    queryResult.isFetching,
  ]);

  const results: SearchResults | null = status.kind === "loaded" ? status.results : null;

  return {
    status,
    results,
  } as const satisfies Readonly<{ status: CommandPaletteSearchStatus; results: SearchResults | null }>;
};

