import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("root test:unit defers rebuilt web ownership to apps/web", () => {
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

  assert.doesNotMatch(rootTestUnit, /tests\/unit\/web-(?!runtime-reset-contract)/);
  assert.match(webTestUnit, /vitest run/);
});

test("apps/web/dist remains outside tracked source control", () => {
  const trackedDistFiles = execFileSync("git", ["ls-files", "apps/web/dist"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  assert.equal(trackedDistFiles, "");
});
