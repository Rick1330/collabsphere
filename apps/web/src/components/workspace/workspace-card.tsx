"use client";

import Link from "next/link";

import { cn } from "@collabsphere/ui/lib/utils";

import type { WorkspaceSummary } from "@/lib/api/workspaces";
import { fullDateTime, getInitials, getWorkspaceTypeClasses, relativeTime } from "@/lib/format";

type WorkspaceCardProps = {
  workspace: WorkspaceSummary;
};

export function WorkspaceCard({ workspace }: Readonly<WorkspaceCardProps>) {
  const tone = getWorkspaceTypeClasses(workspace.type);
  const initials = workspace.icon ?? getInitials(workspace.name);

  return (
    <Link
      href={`/w/${workspace.id}`}
      className="group block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition duration-200 group-hover:scale-105",
              tone.mark,
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-stone-900 transition group-hover:text-teal-700">
              {workspace.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-stone-500">
              {workspace.description || "No description yet."}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]",
            tone.badge,
          )}
        >
          {workspace.type}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-xs text-stone-500 sm:grid-cols-3">
        <div>
          <dt className="font-mono uppercase tracking-[0.16em] text-stone-400">Role</dt>
          <dd className="mt-1 font-medium text-stone-700">{workspace.roleLabel}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-[0.16em] text-stone-400">Last opened</dt>
          <dd className="mt-1 font-medium text-stone-700" title={fullDateTime(workspace.lastAccessedAt)}>
            {relativeTime(workspace.lastAccessedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-[0.16em] text-stone-400">Created</dt>
          <dd className="mt-1 font-medium text-stone-700" title={fullDateTime(workspace.createdAt)}>
            {relativeTime(workspace.createdAt)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

