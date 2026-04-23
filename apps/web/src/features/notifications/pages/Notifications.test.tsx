import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Notifications from "./Notifications";

// Smoke: the migrated Notifications page mounts under the SPA router with a
// fresh QueryClient and renders its page chrome / loading skeleton without
// crashing during the initial async fetch from the notifications adapter.
describe("Notifications page (smoke)", () => {
  it("mounts at /notifications without crashing", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/notifications"]}>
          <Routes>
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // NotificationCenter renders a "Notifications" page header inside the
    // shell. Multiple matches are fine (sidebar nav also includes the word).
    expect(screen.getAllByText(/notifications/i).length).toBeGreaterThan(0);
  });
});
