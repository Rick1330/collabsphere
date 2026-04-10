"use client";

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

const initialStatus = (): CommandPaletteSearchStatus => ({ kind: "idle" });

export const useCommandPaletteSearch = ({
  query,
  scope,
  workspaceId,
}: Readonly<UseCommandPaletteSearchOptions>) => {
  const [status, setStatus] = React.useState<CommandPaletteSearchStatus>(initialStatus);
  const requestSeq = React.useRef(0);
  const abortController = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const normalized = normalizeCommandPaletteQuery(query);

    if (normalized.length < 2) {
      abortController.current?.abort();
      abortController.current = null;
      setStatus({ kind: "idle" });
      return;
    }

    if (scope === "workspace" && !workspaceId) {
      abortController.current?.abort();
      abortController.current = null;
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "loading", query: normalized });

    const timeoutId = window.setTimeout(() => {
      const currentSeq = requestSeq.current + 1;
      requestSeq.current = currentSeq;

      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;

      void search({
        q: normalized,
        scope,
        workspaceId: scope === "workspace" ? workspaceId : null,
        signal: controller.signal,
        types: ["documents", "tasks"],
        page: 1,
        pageSize: 25,
      })
        .then((response) => {
          if (requestSeq.current !== currentSeq) {
            return;
          }

          setStatus({ kind: "loaded", query: response.query, results: response.results });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestSeq.current !== currentSeq) {
            return;
          }

          if (error instanceof SearchApiError) {
            setStatus({
              kind: "error",
              query: normalized,
              message: error.message,
              requestId: error.requestId,
            });
            return;
          }

          setStatus({
            kind: "error",
            query: normalized,
            message: "Search could not be completed.",
            requestId: null,
          });
        });
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.current?.abort();
      abortController.current = null;
    };
  }, [query, scope, workspaceId]);

  const results = status.kind === "loaded" ? status.results : null;

  return {
    status,
    results,
  } as const satisfies Readonly<{ status: CommandPaletteSearchStatus; results: SearchResults | null }>;
};
