import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsSection } from "@/components/settings/settings-section";

describe("SettingsSection", () => {
  it("renders the title", () => {
    render(
      <SettingsSection title="Appearance">
        <div>Panel body</div>
      </SettingsSection>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Appearance" })).toBeVisible();
  });

  it("conditionally renders the description", () => {
    const { rerender } = render(
      <SettingsSection title="Appearance" description="Theme preferences">
        <div>Panel body</div>
      </SettingsSection>,
    );

    expect(screen.getByText("Theme preferences")).toBeVisible();

    rerender(
      <SettingsSection title="Appearance">
        <div>Panel body</div>
      </SettingsSection>,
    );

    expect(screen.queryByText("Theme preferences")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <SettingsSection title="Appearance">
        <button type="button">Save changes</button>
      </SettingsSection>,
    );

    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
