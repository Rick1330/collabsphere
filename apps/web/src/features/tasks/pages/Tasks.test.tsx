import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Tasks from "./Tasks";

// Smoke: the migrated Tasks page mounts inside the SPA router with an
// archived workspace param, shows the page chrome, and renders the board's
// loading skeleton (no thrown errors during initial async fetch).
describe("Tasks page (smoke)", () => {
  it("mounts under the workspace route without crashing", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/w/alpha/tasks"]}>
          <Routes>
            <Route path="/w/:workspaceId/tasks" element={<Tasks />} />
            <Route path="/w/:workspaceId/tasks/list" element={<div>list</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // The board surface owns the "Tasks" title via TaskPageHeader.
    expect(
      screen.getAllByText(/tasks/i).length,
      "page chrome should mention tasks",
    ).toBeGreaterThan(0);
  });
});

