import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ThemeUserMenu } from "../user-theme-menu";
import { themePreferenceStorageKey } from "../../../lib/theme";
import { renderWithProviders } from "./render-with-providers";

describe("theme user menu interactions", () => {
  it("opens accessibly and persists the selected theme preference", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ThemeUserMenu />);

    const trigger = screen.getByRole("button", { name: /CollabSphere member/i });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Dashboard/i })).toHaveFocus();

    await user.click(screen.getByRole("menuitemradio", { name: /Dark/i }));

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Dark locked");
    expect(window.localStorage.getItem(themePreferenceStorageKey)).toBe("dark");
  });
});
