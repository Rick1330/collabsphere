"use client";

import Link from "next/link";

import type { WorkspaceApiError, WorkspaceSummary } from "@/lib/api/workspaces";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { SectionError } from "@/components/shared/section-error";

type DashboardWorkspacesProps = {
  isPending: boolean;
  onRetry: () => void;
  workspaces: readonly WorkspaceSummary[] | undefined;
  error: WorkspaceApiError | null;
};

function WorkspaceSkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-xl bg-stone-100" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-stone-100" />
          <div className="mt-2 h-3 w-48 rounded bg-stone-100" />
        </div>
      </div>
      <div className="mt-4 grid gap-2 border-t border-stone-100 pt-4">
        <div className="h-3 w-full rounded bg-stone-100" />
        <div className="h-3 w-4/5 rounded bg-stone-100" />
      </div>
    </div>
  );
}

function WorkspaceGrid({ workspaces }: Readonly<{ workspaces: readonly WorkspaceSummary[] }>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workspaces.slice(0, 6).map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}

function DashboardWorkspacesBody({
  error,
  isPending,
  onRetry,
  workspaces,
}: Readonly<DashboardWorkspacesProps>) {
  if (isPending && !workspaces) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <WorkspaceSkeletonCard />
        <WorkspaceSkeletonCard />
        <WorkspaceSkeletonCard />
        <WorkspaceSkeletonCard />
      </div>
    );
  }

  if (error && !workspaces) {
    return (
      <SectionError
        title="Workspaces couldn’t be loaded"
        message={error.message}
        requestId={error.requestId}
        onRetry={onRetry}
      />
    );
  }

  if (workspaces && workspaces.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center shadow-sm">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <div className="flex -space-x-3 opacity-70" aria-hidden="true">
            <div className="h-20 w-28 rounded-2xl border border-stone-200 bg-stone-50 shadow-sm" />
            <div className="mt-5 h-20 w-28 rounded-2xl border border-stone-200 bg-white shadow-sm" />
            <div className="h-20 w-28 rounded-2xl border border-stone-200 bg-stone-50 shadow-sm" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">No workspaces yet</h3>
          <p className="text-sm text-stone-500">
            Create the first collaboration space and the dashboard will start reflecting recent work here.
          </p>
          <Link
            href="/workspaces/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-bg-primary)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2"
          >
            New workspace
          </Link>
        </div>
      </div>
    );
  }

  if (workspaces && workspaces.length > 0) {
    return <WorkspaceGrid workspaces={workspaces} />;
  }

  return null;
}

export function DashboardWorkspaces(props: Readonly<DashboardWorkspacesProps>) {
  return (
    <section aria-labelledby="dashboard-workspaces-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="dashboard-workspaces-heading"
          className="flex items-center gap-2 text-sm font-semibold text-stone-900"
        >
          Your workspaces
          <span className="font-mono text-[10px] text-stone-400">
            {props.workspaces ? props.workspaces.length : "LIVE"}
          </span>
        </h2>
        <Link href="/workspaces" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          View all
        </Link>
      </div>
      <DashboardWorkspacesBody {...props} />
    </section>
  );
}
