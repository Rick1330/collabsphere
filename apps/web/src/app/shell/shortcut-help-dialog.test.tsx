/**
 * Tests for ShortcutHelpDialog.
 *
 * Confirms the help dialog opens in response to the global "open help" event
 * and renders the shortcut groups from the central registry.
 */
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ShortcutHelpDialog } from "@/app/shell/shortcut-help-dialog";
import { emitOpenHelp } from "@/lib/shortcut-events";

describe("ShortcutHelpDialog", () => {
  it("is closed initially and opens on the open-help event", async () => {
    render(<ShortcutHelpDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      emitOpenHelp();
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    // Title (use getAllByText since the footer also references "shortcuts").
    expect(screen.getAllByText(/keyboard shortcuts/i).length).toBeGreaterThan(0);
    // Group headings render — use heading role to avoid matching the
    // "Open command palette" / "Go to dashboard" rows that contain those words.
    expect(screen.getByRole("heading", { name: /global/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /navigation/i })).toBeInTheDocument();
    // A representative shortcut row.
    expect(screen.getByText(/open command palette/i)).toBeInTheDocument();
  });
});
