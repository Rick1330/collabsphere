import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");

test("ci workflow defines the required pull request jobs and services", async () => {
  const workflow = parse(await readFile(workflowPath, "utf8"));
  const jobs = workflow.jobs ?? {};

  assert.deepEqual(
    [...new Set(Object.keys(jobs))].sort(),
    [
      "lint",
      "typecheck",
      "unit-tests",
      "integration-tests",
      "build-web",
      "build-api",
      "build-collab",
      "build-worker",
    ].sort(),
  );

  assert.equal(workflow.name, "CI");
  assert.ok(workflow.on.pull_request, "workflow must trigger on pull requests");
  assert.equal(jobs["integration-tests"].services.postgres.image, "postgres:16-alpine");
  assert.equal(jobs["integration-tests"].services.redis.image, "redis:7-alpine");
});
