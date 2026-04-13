import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/foundation/use-command-palette-search", () => ({
  useCommandPaletteSearch: () => ({
    status: { kind: "idle" },
  }),
}));

import { TopNavBar } from "../components/foundation/top-nav-bar";
import { globalNavItems } from "../components/foundation/navigation";
import { ThemeUserMenu } from "../components/foundation/user-theme-menu";
import { WorkspaceSwitcherMenu } from "../components/foundation/workspace-switcher";
import { renderWithProviders } from "./render-with-providers";

describe("top nav interactions", () => {
  it("opens and closes the command palette from the top-nav search trigger", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TopNavBar
        mobileMenuDescription="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        mobileMenuTitle="Personal workspace shell"
        mobileNavItems={globalNavItems}
        notificationBell={<div>Notifications</div>}
        workspaceSwitcher={
          <WorkspaceSwitcherMenu
            currentWorkspaceId={null}
            dataState={{
              kind: "loaded",
              workspaces: [
                {
                  id: "workspace-alpha",
                  name: "Alpha Launch",
                  description: "Launch room",
                  type: "professional",
                  icon: "📦",
                  myRole: "MANAGER",
                  roleLabel: "Tech Lead",
                  lastAccessedAt: "2025-07-17T12:00:00Z",
                  createdAt: "2025-07-11T12:00:00Z",
                },
              ],
            }}
          />
        }
        userMenu={<ThemeUserMenu />}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open command palette" });
    await user.click(trigger);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close command palette" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
