import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";

import { repoRoot } from "./bootstrap-test-helpers";

const escapedDot = String.raw`\.`;
const gitExecutable = resolveGitExecutable();

function resolveGitExecutable() {
  const candidates =
    process.platform === "win32"
      ? [
          join(process.env["ProgramFiles"] ?? "", "Git", "cmd", "git.exe"),
          join(process.env["ProgramFiles"] ?? "", "Git", "bin", "git.exe"),
          join(process.env["ProgramFiles(x86)"] ?? "", "Git", "cmd", "git.exe"),
          join(process.env["ProgramFiles(x86)"] ?? "", "Git", "bin", "git.exe"),
        ]
      : ["/usr/bin/git", "/usr/local/bin/git", "/opt/homebrew/bin/git"];

  const gitPath = candidates.find((candidate) => candidate && existsSync(candidate));
  assert.ok(gitPath, "Expected git to be installed in a fixed system location for reset contract checks.");
  return gitPath;
}

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
    const escapedFilename = filename.replaceAll(".", escapedDot);
    assert.match(rootTestUnit, new RegExp(`tests/unit/${escapedFilename}`));
  }
});

test("apps/web/dist remains outside tracked source control", () => {
  const trackedDistFiles = execFileSync(gitExecutable, ["ls-files", "apps/web/dist"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  assert.equal(trackedDistFiles, "");
});
