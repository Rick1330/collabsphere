import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";

import { repoRoot } from "./bootstrap-test-helpers";

test("root test:unit keeps legacy web tests covered until their migration is complete", () => {
  const rootPackageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const webPackageJson = JSON.parse(
    readFileSync(join(repoRoot, "apps", "web", "package.json"), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };

  const rootTestUnit = rootPackageJson.scripts?.["test:unit"] ?? "";
  const webTestUnit = webPackageJson.scripts?.["test:unit"] ?? "";
  const legacyWebTests = readdirSync(join(repoRoot, "tests", "unit")).filter(
    (filename) => filename.startsWith("web-") && filename !== "web-runtime-reset-contract.test.ts",
  );

  assert.match(webTestUnit, /vitest run/);
  assert.ok(legacyWebTests.length > 0);

  for (const filename of legacyWebTests) {
    assert.match(rootTestUnit, new RegExp(`tests/unit/${filename.replaceAll(".", String.raw`\.`)}`));
  }
});

test("apps/web/dist remains outside tracked source control", () => {
  const trackedDistFiles = execFileSync("git", ["ls-files", "apps/web/dist"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  assert.equal(trackedDistFiles, "");
});
