import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { NotificationCenter } from "@/components/notification/notification-center";
import { CreateWizard } from "@/components/workspace/create-wizard";
import { WorkspaceList } from "@/components/workspace/workspace-list";

const originalFetch = global.fetch;

const workspacePayload = {
  data: {
    items: [
      {
        id: "workspace-alpha",
        name: "Project Alpha",
        description: "Primary delivery workspace",
        type: "professional",
        icon: "AL",
        myRole: "OWNER",
        roleLabel: "Owner",
        lastAccessedAt: "2026-04-16T07:45:00.000Z",
        createdAt: "2026-04-01T09:00:00.000Z",
      },
      {
        id: "workspace-beta",
        name: "Seminar Board",
        description: "Academic coordination hub",
        type: "academic",
        icon: null,
        myRole: "MEMBER",
        roleLabel: "Member",
        lastAccessedAt: "2026-04-15T07:45:00.000Z",
        createdAt: "2026-04-02T09:00:00.000Z",
      },
    ],
  },
};

const notificationsPayload = {
  data: {
    items: [
      {
        id: "notif-1",
        type: "task.assigned",
        workspaceId: "workspace-alpha",
        title: "Review homepage shell",
        body: "A task needs attention before handoff.",
        url: "/notifications",
        isRead: false,
        createdAt: "2026-04-16T07:00:00.000Z",
      },
      {
        id: "notif-2",
        type: "document.mention",
        workspaceId: "workspace-beta",
        title: "New mention in sprint notes",
        body: "A new mention is waiting in the notes document.",
        url: "/notifications",
        isRead: true,
        createdAt: "2026-04-16T06:00:00.000Z",
      },
    ],
  },
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  global.fetch = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/api/v1/workspaces")) {
      return Promise.resolve(
        new Response(JSON.stringify(workspacePayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/tasks/mine")) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: { code: "NOT_FOUND" }, meta: { requestId: "req_tasks" } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/activity/mine")) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: { code: "NOT_FOUND" }, meta: { requestId: "req_activity" } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/notifications/unread-count")) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: { unreadCount: 1 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/notifications?page=1&pageSize=10")) {
      return Promise.resolve(
        new Response(JSON.stringify(notificationsPayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/notifications/mark-all-read")) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: { updatedCount: 1 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    if (url.includes("/api/v1/notifications/notif-1/read")) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: { id: "notif-1", isRead: true, readAt: "2026-04-16T08:00:00.000Z" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  }) as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("PRJ-02 reset authenticated surfaces", () => {
  it("renders the rebuilt dashboard with live workspaces and truthful unavailable task/activity states", async () => {
    renderWithQuery(<DashboardContent />);

    await screen.findByText("Project Alpha");

    expect(screen.getByRole("heading", { level: 1, name: /Good /i })).toBeVisible();
    expect(screen.getByText("Task feed arrives with the task domain")).toBeVisible();
    expect(screen.getByText("Activity timeline comes online with collaboration feeds")).toBeVisible();
  });

  it("filters the rebuilt workspace list client-side without breaking the loaded cards", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WorkspaceList />);

    await screen.findByText("Project Alpha");
    expect(screen.getByText("Seminar Board")).toBeVisible();

    await user.type(screen.getByLabelText("Search workspaces"), "seminar");

    await waitFor(() => {
      expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Seminar Board")).toBeVisible();
  });

  it("renders notification center filtering and wizard step progression", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <div>
        <NotificationCenter />
        <CreateWizard />
      </div>,
    );

    await screen.findByText("Review homepage shell");
    await user.click(screen.getByRole("button", { name: "Unread" }));

    await waitFor(() => {
      expect(screen.queryByText("New mention in sprint notes")).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Workspace name"), "Reset shell");
    await user.click(screen.getByRole("button", { name: "Choose type" }));
    await user.click(screen.getByRole("button", { name: /Academic/i }));

    expect(screen.getByText("Review your draft")).toBeVisible();
    expect(screen.getByText("Academic")).toBeVisible();
  });

  it("renders a notification error state when the feed request fails", async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/v1/notifications/unread-count")) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { unreadCount: 0 } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }

      if (url.includes("/api/v1/notifications?page=1&pageSize=10")) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Feed unavailable" }, meta: { requestId: "req_notifications" } }), {
            status: 500,
            headers: { "content-type": "application/json" },
          }),
        );
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }) as typeof fetch;

    renderWithQuery(<NotificationCenter />);

    expect(await screen.findByText("Notifications couldn’t be loaded")).toBeVisible();
    expect(screen.getByText("Failed to load notifications. Please try again.")).toBeVisible();
    expect(screen.getByText(/req_notifications/i)).toBeVisible();
  });
});
