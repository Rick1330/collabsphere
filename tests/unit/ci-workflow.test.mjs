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
  const jobNames = [
    "lint",
    "typecheck",
    "unit-tests",
    "integration-tests",
    "build-web",
    "build-api",
    "build-collab",
    "build-worker",
  ];

  assert.deepEqual(
    [...new Set(Object.keys(jobs))].sort(),
    jobNames.sort(),
  );

  assert.equal(workflow.name, "CI");
  assert.ok(workflow.on.pull_request, "workflow must trigger on pull requests");
  assert.equal(jobs["integration-tests"].services.postgres.image, "postgres:16-alpine");
  assert.equal(jobs["integration-tests"].services.redis.image, "redis:7-alpine");

  for (const jobName of jobNames) {
    const setupNode = jobs[jobName].steps.find((step) => step.uses === "actions/setup-node@v4");
    assert.ok(setupNode, `${jobName} must configure actions/setup-node`);
    assert.equal(setupNode.with?.cache, "pnpm", `${jobName} must cache the pnpm store`);
    assert.equal(
      setupNode.with?.["cache-dependency-path"],
      "pnpm-lock.yaml",
      `${jobName} must key pnpm cache with pnpm-lock.yaml`,
    );
  }
});
