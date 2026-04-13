import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileMenu } from "../components/foundation/mobile-menu";
import { globalNavItems } from "../components/foundation/navigation";
import { renderWithProviders } from "./render-with-providers";

describe("mobile menu interactions", () => {
  it("opens from the trigger, autofocuses the close button, and restores focus on close", async () => {
    window.innerWidth = 390;

    const user = userEvent.setup();
    renderWithProviders(
      <MobileMenu
        description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        navItems={globalNavItems}
        title="Personal workspace shell"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(trigger);

    const closeButton = await screen.findByRole("button", {
      name: "Close navigation menu",
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(closeButton).toHaveFocus();

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
