import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  WorkspaceSwitcherMenu,
  type WorkspaceSwitcherDataState,
} from "../components/foundation/workspace-switcher";
import { renderWithProviders } from "./render-with-providers";

const loadedState: WorkspaceSwitcherDataState = {
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
};

describe("workspace switcher interactions", () => {
  it("runs create-workspace action and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onCreateWorkspace = vi.fn();

    renderWithProviders(
      <WorkspaceSwitcherMenu
        currentWorkspaceId={null}
        dataState={loadedState}
        onCreateWorkspace={onCreateWorkspace}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Select Workspace/i });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    await user.click(await screen.findByRole("menuitem", { name: /Create workspace/i }));

    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
