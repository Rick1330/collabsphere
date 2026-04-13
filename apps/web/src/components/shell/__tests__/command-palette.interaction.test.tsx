import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  CommandPalette,
  type CommandPaletteGroup,
} from "../command-palette";
import { renderWithProviders } from "./render-with-providers";

function CommandPaletteHarness({
  groups,
  onCloseSpy,
}: Readonly<{
  groups: readonly CommandPaletteGroup[];
  onCloseSpy: () => void;
}>) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Open palette
      </button>
      <CommandPalette
        groups={groups}
        isOpen={isOpen}
        onClose={() => {
          onCloseSpy();
          setIsOpen(false);
        }}
        onQueryChange={setQuery}
        query={query}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}

describe("command palette interactions", () => {
  it("navigates results by keyboard, selects the active item, and restores focus", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    const onSelectSpy = vi.fn();

    renderWithProviders(
      <CommandPaletteHarness
        onCloseSpy={onCloseSpy}
        groups={[
          {
            id: "recent",
            label: "Recent",
            items: [
              { id: "doc-intro", label: "Introduction", onSelect: onSelectSpy },
              { id: "doc-roadmap", label: "Roadmap" },
            ],
          },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open palette" });
    await user.click(trigger);

    const input = screen.getByRole("combobox", { name: "Search commands" });
    expect(input).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Introduction" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{Enter}");

    expect(onSelectSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();

    renderWithProviders(
      <CommandPaletteHarness
        onCloseSpy={onCloseSpy}
        groups={[
          {
            id: "recent",
            label: "Recent",
            items: [{ id: "doc-intro", label: "Introduction" }],
          },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open palette" });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });
});
