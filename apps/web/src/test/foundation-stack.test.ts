import { describe, expect, it } from "vitest";

import { cn } from "@collabsphere/ui";

describe("frontend foundation stack wiring", () => {
  it("resolves shared ui helpers through the workspace package", () => {
    expect(cn("rounded-md", undefined, "px-4")).toBe("rounded-md px-4");
  });
});
