/**
 * Tests for the `v b` / `v l` task view shortcuts.
 *
 * Both the board and list pages register the same pair of shortcuts so the
 * user can flip views from either starting point. Rather than mounting the
 * full Tasks page (which pulls in mock data, react-query, the sheet, etc.),
 * this test exercises the same `useHotkey("v b" | "v l")` registrations
 * against a tiny harness that just calls `useNavigate`.
 *
 * What we lock down:
 *  - `v b` from the list route navigates to /w/:id/tasks
 *  - `v l` from the board route navigates to /w/:id/tasks/list
 *  - both shortcuts are blocked when typing inside an input (guard contract)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useHotkey } from "@/hooks/use-hotkey";

const TaskViewShortcuts = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  useHotkey("v b", () => navigate(`/w/${workspaceId}/tasks`));
  useHotkey("v l", () => navigate(`/w/${workspaceId}/tasks/list`));
  return (
    <input aria-label="Search tasks" placeholder="search" data-testid="search" />
  );
};

const LocationProbe = () => {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
};

const renderAt = (initial: string) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="/w/:workspaceId/tasks"
          element={
            <>
              <TaskViewShortcuts />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/w/:workspaceId/tasks/list"
          element={
            <>
              <TaskViewShortcuts />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const fireSequence = (keys: string[]) => {
  for (const key of keys) {
    fireEvent.keyDown(window, { key, bubbles: true, cancelable: true });
  }
};

describe("Tasks view shortcuts (v b / v l)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("navigates from /tasks/list to /tasks via `v b`", async () => {
    const { getByTestId } = renderAt("/w/alpha/tasks/list");
    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks/list");

    await act(async () => {
      fireSequence(["v", "b"]);
    });

    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks");
  });

  it("navigates from /tasks (board) to /tasks/list via `v l`", async () => {
    const { getByTestId } = renderAt("/w/alpha/tasks");
    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks");

    await act(async () => {
      fireSequence(["v", "l"]);
    });

    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks/list");
  });

  it("does not fire while typing inside the search input", async () => {
    const { getByTestId } = renderAt("/w/alpha/tasks");
    const input = getByTestId("search") as HTMLInputElement;
    input.focus();

    await act(async () => {
      fireEvent.keyDown(input, { key: "v", bubbles: true });
      fireEvent.keyDown(input, { key: "l", bubbles: true });
    });

    // Stayed on the board page — input guard prevented the navigation.
    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks");
  });

  it("does not fire when a foreground dialog is open", async () => {
    const { getByTestId } = renderAt("/w/alpha/tasks");

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    await act(async () => {
      fireSequence(["v", "l"]);
    });

    expect(getByTestId("location").textContent).toBe("/w/alpha/tasks");
  });
});
