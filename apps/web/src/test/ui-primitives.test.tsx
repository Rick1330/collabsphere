import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Button,
  Input,
  Label,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@collabsphere/ui";

describe("owned ui primitive coverage", () => {
  it("renders basic form primitives with accessible label wiring", () => {
    render(
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
        <Separator decorative={false} data-testid="separator" />
        <Button type="submit">Continue</Button>
      </div>,
    );

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(screen.getByTestId("separator")).toHaveAttribute("role", "separator");
  });

  it("supports sheet open and close behavior through the owned primitive layer", async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open navigation</Button>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby="sheet-description">
          <SheetTitle>Workspace navigation</SheetTitle>
          <SheetDescription id="sheet-description">
            Side-panel navigation contract for near-term delivery surfaces.
          </SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Workspace navigation")).toBeVisible();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
