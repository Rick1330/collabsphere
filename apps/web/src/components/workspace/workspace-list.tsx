"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@collabsphere/ui/components/input";

import {
  listWorkspaces,
  workspaceListQueryKey,
  type WorkspaceApiError,
  type WorkspaceSummary,
} from "@/lib/api/workspaces";
import { SectionError } from "@/components/shared/section-error";
import { WorkspaceCard } from "./workspace-card";

const isWorkspaceApiError = (error: unknown): error is WorkspaceApiError =>
  error instanceof Error && "requestId" in error;

type WorkspaceListState = "loading" | "error" | "empty" | "content" | "idle";

function WorkspaceSkeletonGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-48 rounded-2xl border border-stone-200 bg-white shadow-sm" />
      ))}
    </div>
  );
}

function WorkspaceListErrorState({
  error,
  onRetry,
}: Readonly<{
  error: Error;
  onRetry: () => void;
}>) {
  return (
    <SectionError
      title="Workspace list unavailable"
      message="Unable to load workspaces right now. Please try again."
      requestId={isWorkspaceApiError(error) ? error.requestId : null}
      onRetry={onRetry}
    />
  );
}

function WorkspaceListEmptyState({ query }: Readonly<{ query: string }>) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/80 p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-stone-900">
        {query ? "No matching workspaces" : "No workspaces yet"}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {query
          ? "Try a different name, type, or description."
          : "Create your first workspace to start collaborating."}
      </p>
    </div>
  );
}

function getWorkspaceListState({
  error,
  filtered,
  hasData,
  isPending,
}: Readonly<{
  filtered: readonly WorkspaceSummary[];
  error: Error | null;
  hasData: boolean;
  isPending: boolean;
}>): WorkspaceListState {
  if (isPending && !hasData) {
    return "loading";
  }

  if (error && !hasData) {
    return "error";
  }

  if (filtered.length > 0) {
    return "content";
  }

  if (!isPending && !error) {
    return "empty";
  }

  return "idle";
}

function WorkspaceListBody({
  error,
  filtered,
  hasData,
  isPending,
  onRetry,
  query,
}: Readonly<{
  query: string;
  filtered: readonly WorkspaceSummary[];
  error: Error | null;
  isPending: boolean;
  hasData: boolean;
  onRetry: () => void;
}>) {
  switch (getWorkspaceListState({ error, filtered, hasData, isPending })) {
    case "loading":
      return <WorkspaceSkeletonGrid />;
    case "error":
      return error ? <WorkspaceListErrorState error={error} onRetry={onRetry} /> : null;
    case "empty":
      return <WorkspaceListEmptyState query={query} />;
    case "content":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function WorkspaceList() {
  const [query, setQuery] = useState("");
  const workspaceQuery = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
    retry: false,
    staleTime: 60_000,
  });
  const workspaces = workspaceQuery.data ?? [];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return workspaces;
    }

    return workspaces.filter((workspace) =>
      `${workspace.name} ${workspace.description ?? ""} ${workspace.type}`.toLowerCase().includes(normalized),
    );
  }, [query, workspaces]);
  const error = workspaceQuery.error instanceof Error ? workspaceQuery.error : null;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-stone-900">
              Workspaces
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[11px] text-stone-500">
                {workspaces.length}
              </span>
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Search and revisit the collaboration spaces you already belong to.
            </p>
          </div>
          <Link
            href="/workspaces/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-bg-primary)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2"
          >
            New workspace
          </Link>
        </div>
        <div className="mt-5">
          <label className="sr-only" htmlFor="workspace-search">
            Search workspaces
          </label>
          <Input
            id="workspace-search"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            placeholder="Search by workspace name, type, or description"
            className="h-11 rounded-xl border-stone-200 bg-stone-50 px-4"
          />
        </div>
      </section>

      <WorkspaceListBody
        error={error}
        filtered={filtered}
        hasData={Boolean(workspaceQuery.data)}
        isPending={workspaceQuery.isPending}
        onRetry={() => {
          workspaceQuery.refetch().catch(() => undefined);
        }}
        query={query}
      />
    </div>
  );
}
