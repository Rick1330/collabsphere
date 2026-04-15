import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cn } from "@collabsphere/ui";

describe("frontend foundation stack wiring", () => {
  it("resolves shared ui helpers through the workspace package", () => {
    expect(cn("rounded-md", undefined, "px-4")).toBe("rounded-md px-4");
  });

  it("keeps app-level primitive configuration aligned to the shared ui package", () => {
    const componentsConfig = JSON.parse(
      readFileSync(join(process.cwd(), "components.json"), "utf8"),
    ) as {
      aliases?: Record<string, string>;
      tailwind?: Record<string, string | boolean>;
    };

    expect(componentsConfig.aliases?.ui).toBe("@collabsphere/ui/components");
    expect(componentsConfig.aliases?.utils).toBe("@collabsphere/ui/lib/utils");
    expect(componentsConfig.tailwind?.css).toBe("src/app/globals.css");
  });
});
