import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "../landing-page";

describe("landing page", () => {
  it("renders the new public product narrative and primary calls to action", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Collaboration without context switching.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start in one workspace" }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.getByRole("link", { name: "Enter the workspace" }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByText("Desktop, tablet, and phone"),
    ).toBeInTheDocument();
  });
});
