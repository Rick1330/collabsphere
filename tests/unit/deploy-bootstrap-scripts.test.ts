import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const readScript = (fileName: string) => readFile(path.join(repoRoot, "scripts", fileName), "utf8");

test("bootstrap scripts prioritize explicit --environment flags over DEPLOY_ENVIRONMENT", async () => {
  const cases = [
    {
      fileName: "bootstrap-aca-staging.ts",
      pattern: /environmentArgValue \?\? process\.env\.DEPLOY_ENVIRONMENT \?\? "staging"/,
    },
    {
      fileName: "bootstrap-r2.ts",
      pattern:
        /readArgValue\(\{ name: "--environment" \}\) \?\? process\.env\.DEPLOY_ENVIRONMENT \?\? "staging"/,
    },
    {
      fileName: "bootstrap-aws-production.ts",
      pattern: /environmentArgValue \?\? process\.env\.DEPLOY_ENVIRONMENT \?\? "production"/,
    },
  ] as const;

  for (const entry of cases) {
    assert.match(await readScript(entry.fileName), entry.pattern);
  }
});
