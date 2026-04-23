/**
 * Tests for the `G C` global shortcut (create new document).
 *
 * Behavior we lock down:
 *  - When the user is on `/w/:workspaceId/...`, pressing `g c` navigates
 *    to `/w/:workspaceId/documents/new`.
 *  - When no workspace is in the URL, the shortcut redirects to
 *    `/workspaces` and surfaces a helpful toast.
 *  - Read-only personas (viewer / stakeholder) cannot create documents —
 *    the shortcut shows a permission toast and never navigates.
 *  - Guests (no session) get a silent no-op.
 *
 * The shortcut layer is exercised through the real `GlobalShortcuts`
 * component to avoid drifting from the production wiring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { GlobalShortcuts } from "@/app/shell/global-shortcuts";
import { authSession } from "@/lib/auth-session";

// Capture sonner toast calls without rendering a toaster surface.
const toastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    info: (...args: unknown[]) => toastInfo(...args),
    success: () => undefined,
    error: () => undefined,
  },
}));

const LocationProbe = () => {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
};

const renderAt = (initial: string) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <GlobalShortcuts />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

const fireSequence = (keys: string[]) => {
  for (const key of keys) {
    fireEvent.keyDown(window, { key, bubbles: true, cancelable: true });
  }
};

describe("GlobalShortcuts — `g c` create document", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    toastInfo.mockReset();
    authSession.signOut();
  });

  afterEach(() => {
    authSession.signOut();
  });

  it("derives workspaceId from the URL and navigates to the new-document route", async () => {
    // u_jane = ADMIN, can create documents.
    authSession.signIn("u_jane");
    const { getByTestId } = renderAt("/w/alpha/dashboard");

    await act(async () => {
      fireSequence(["g", "c"]);
    });

    expect(getByTestId("location").textContent).toBe("/w/alpha/documents/new");
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it("redirects to /workspaces with a toast when no workspace is in the URL", async () => {
    authSession.signIn("u_jane");
    const { getByTestId } = renderAt("/dashboard");

    await act(async () => {
      fireSequence(["g", "c"]);
    });

    expect(getByTestId("location").textContent).toBe("/workspaces");
    expect(toastInfo).toHaveBeenCalledTimes(1);
    expect(toastInfo).toHaveBeenCalledWith(
      "Pick a workspace first",
      expect.objectContaining({
        description: expect.stringMatching(/workspace/i),
      }),
    );
  });

  it("blocks creation for read-only roles (viewer/stakeholder)", async () => {
    // Find a viewer-style persona; fall back to mocking the role guard if
    // the seed list doesn't contain one. We grep the mock account list.
    const accounts = await import("@/lib/mock-accounts");
    const viewer = accounts.MOCK_ACCOUNTS.find(
      (a) => a.defaultWorkspaceRole === "VIEWER",
    );
    if (!viewer) {
      // Defensive: if no viewer account exists, this assertion would be
      // meaningless. Surface an explicit failure so the seed gap is visible.
      throw new Error("Expected a VIEWER mock account for permission test");
    }
    authSession.signIn(viewer.id);

    const { getByTestId } = renderAt("/w/alpha/dashboard");

    await act(async () => {
      fireSequence(["g", "c"]);
    });

    // Read-only ⇒ stays on current page, info toast surfaced.
    expect(getByTestId("location").textContent).toBe("/w/alpha/dashboard");
    expect(toastInfo).toHaveBeenCalledTimes(1);
    expect(toastInfo).toHaveBeenCalledWith(
      "Read-only access",
      expect.objectContaining({
        description: expect.stringMatching(/cannot create|browse/i),
      }),
    );
  });

  it("is a silent no-op when no user is signed in", async () => {
    const { getByTestId } = renderAt("/w/alpha/dashboard");

    await act(async () => {
      fireSequence(["g", "c"]);
    });

    expect(getByTestId("location").textContent).toBe("/w/alpha/dashboard");
    expect(toastInfo).not.toHaveBeenCalled();
  });
});
