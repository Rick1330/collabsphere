"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ActivityApiError, listMyActivity, myActivityQueryKey } from "@/lib/api/activity";
import { listMyTasks, myTasksQueryKey, TaskApiError } from "@/lib/api/tasks";
import { listWorkspaces, workspaceListQueryKey, WorkspaceApiError } from "@/lib/api/workspaces";
import { getGreeting } from "@/lib/format";
import { KeyboardHint } from "@/components/shared/keyboard-hint";
import { isMacLikePlatform } from "@/components/shell/desktop-sidebar-shortcut";
import { DashboardActivity } from "./dashboard-activity";
import { DashboardTasks } from "./dashboard-tasks";
import { DashboardWorkspaces } from "./dashboard-workspaces";

const coerceWorkspaceError = (error: unknown) =>
  error instanceof WorkspaceApiError ? error : null;
const coerceTaskError = (error: unknown) => (error instanceof TaskApiError ? error : null);
const coerceActivityError = (error: unknown) =>
  error instanceof ActivityApiError ? error : null;

export function DashboardContent() {
  const greeting = getGreeting();
  const [modifierKey, setModifierKey] = useState<"Ctrl" | "⌘">("Ctrl");
  const workspacesQuery = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
    retry: false,
    staleTime: 60_000,
  });
  const tasksQuery = useQuery({
    queryKey: myTasksQueryKey,
    queryFn: ({ signal }) => listMyTasks({ signal }),
    retry: false,
    staleTime: 60_000,
  });
  const activityQuery = useQuery({
    queryKey: myActivityQueryKey,
    queryFn: ({ signal }) => listMyActivity({ signal }),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setModifierKey(
      isMacLikePlatform({ platform: navigator.platform, userAgent: navigator.userAgent }) ? "⌘" : "Ctrl",
    );
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {greeting.greeting}
            </h1>
            <p className="mt-2 text-sm text-stone-500">{greeting.subtitle}</p>
          </div>
          <Link
            href="/workspaces/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-bg-primary)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2"
          >
            New workspace
          </Link>
        </div>
        <div className="mt-5 hidden items-center gap-5 border-t border-stone-100 pt-4 lg:flex">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            Quick actions
          </span>
          <KeyboardHint keys={[modifierKey, "K"]} label="Command palette" />
          <KeyboardHint keys={[modifierKey, "B"]} label="Toggle sidebar" />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardWorkspaces
          error={coerceWorkspaceError(workspacesQuery.error)}
          isPending={workspacesQuery.isPending}
          onRetry={() => {
            workspacesQuery.refetch().catch(() => undefined);
          }}
          workspaces={workspacesQuery.data}
        />
        <aside className="space-y-6">
          <DashboardTasks
            error={coerceTaskError(tasksQuery.error)}
            isPending={tasksQuery.isPending}
            onRetry={() => {
              tasksQuery.refetch().catch(() => undefined);
            }}
            tasks={tasksQuery.data}
          />
          <DashboardActivity
            activity={activityQuery.data}
            error={coerceActivityError(activityQuery.error)}
            isPending={activityQuery.isPending}
            onRetry={() => {
              activityQuery.refetch().catch(() => undefined);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
