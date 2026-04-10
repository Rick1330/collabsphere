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

type SearchStatusSetter = React.Dispatch<React.SetStateAction<CommandPaletteSearchStatus>>;

const resetSearch = ({
  abortController,
  setStatus,
}: {
  abortController: React.MutableRefObject<AbortController | null>;
  setStatus: SearchStatusSetter;
}) => {
  abortController.current?.abort();
  abortController.current = null;
  setStatus({ kind: "idle" });
};

const toSearchErrorStatus = ({
  error,
  normalizedQuery,
}: {
  error: unknown;
  normalizedQuery: string;
}): CommandPaletteSearchStatus => {
  if (error instanceof SearchApiError) {
    return {
      kind: "error",
      query: normalizedQuery,
      message: error.message,
      requestId: error.requestId,
    };
  }

  return {
    kind: "error",
    query: normalizedQuery,
    message: "Search could not be completed.",
    requestId: null,
  };
};

const runCommandPaletteSearchEffect = ({
  query,
  scope,
  workspaceId,
  requestSeq,
  abortController,
  setStatus,
}: {
  query: string;
  scope: SearchScope;
  workspaceId: string | null;
  requestSeq: React.MutableRefObject<number>;
  abortController: React.MutableRefObject<AbortController | null>;
  setStatus: SearchStatusSetter;
}) => {
  const normalized = normalizeCommandPaletteQuery(query);

  if (normalized.length < 2) {
    resetSearch({ abortController, setStatus });
    return;
  }

  if (scope === "workspace" && !workspaceId) {
    resetSearch({ abortController, setStatus });
    return;
  }

  setStatus({ kind: "loading", query: normalized });

  const timeoutId = window.setTimeout(() => {
    const currentSeq = requestSeq.current + 1;
    requestSeq.current = currentSeq;

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    const scopeSnapshot = scope;
    const workspaceIdSnapshot = workspaceId;

    const requestPromise =
      scopeSnapshot === "workspace"
        ? workspaceIdSnapshot
          ? search({
              q: normalized,
              scope: scopeSnapshot,
              workspaceId: workspaceIdSnapshot,
              signal: controller.signal,
              types: ["documents", "tasks"],
              page: 1,
              pageSize: 25,
            })
          : null
        : search({
            q: normalized,
            scope: scopeSnapshot,
            signal: controller.signal,
            types: ["documents", "tasks"],
            page: 1,
            pageSize: 25,
          });

    if (!requestPromise) {
      return;
    }

    void requestPromise
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

        setStatus(toSearchErrorStatus({ error, normalizedQuery: normalized }));
      });
  }, 200);

  return () => {
    window.clearTimeout(timeoutId);
    abortController.current?.abort();
    abortController.current = null;
  };
};

export const useCommandPaletteSearch = ({
  query,
  scope,
  workspaceId,
}: Readonly<UseCommandPaletteSearchOptions>) => {
  const [status, setStatus] = React.useState<CommandPaletteSearchStatus>(initialStatus);
  const requestSeq = React.useRef(0);
  const abortController = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return runCommandPaletteSearchEffect({
      query,
      scope,
      workspaceId,
      requestSeq,
      abortController,
      setStatus,
    });
  }, [query, scope, workspaceId]);

  const results = status.kind === "loaded" ? status.results : null;

  return {
    status,
    results,
  } as const satisfies Readonly<{ status: CommandPaletteSearchStatus; results: SearchResults | null }>;
};
