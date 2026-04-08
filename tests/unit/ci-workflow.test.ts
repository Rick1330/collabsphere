import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");
const requiredJobNames = [
  "lint",
  "typecheck",
  "unit-tests",
  "integration-tests",
  "build-web",
  "build-api",
  "build-collab",
  "build-worker",
] as const;

type WorkflowJob = {
  services?: Record<string, { image?: string }>;
  steps?: Array<Record<string, unknown>>;
};

type CiWorkflow = {
  name?: string;
  on?: { pull_request?: unknown };
  jobs?: Record<string, WorkflowJob>;
};

const readWorkflow = async () =>
  parse(await readFile(workflowPath, "utf8")) as CiWorkflow;

const assertRequiredJobs = (jobs: Record<string, WorkflowJob>) => {
  const compare = (left: string, right: string) => left.localeCompare(right);

  assert.deepEqual(
    [...new Set(Object.keys(jobs))].sort(compare),
    [...requiredJobNames].sort(compare),
  );
};

const assertWorkflowMetadata = (workflow: CiWorkflow) => {
  assert.equal(workflow.name, "CI");
  assert.ok(
    workflow.on && Object.prototype.hasOwnProperty.call(workflow.on, "pull_request"),
    "workflow must trigger on pull requests",
  );
};

const assertIntegrationServices = (jobs: Record<string, WorkflowJob>) => {
  assert.equal(jobs["integration-tests"]?.services?.postgres?.image, "postgres:16-alpine");
  assert.equal(jobs["integration-tests"]?.services?.redis?.image, "redis:7-alpine");
};

const setupNodeActionPattern =
  /^actions\/setup-node@(?:v4|49933ea5288caeca8642d1e84afbd3f7d6820020)(?:\s+#.*)?$/;

const getSetupNodeStep = (steps: Array<Record<string, unknown>>) =>
  steps.find(
    (step) => typeof step.uses === "string" && setupNodeActionPattern.test(step.uses),
  ) as
    | { uses?: string; with?: Record<string, string> }
    | undefined;

const assertJobCachesPnpmStore = (jobName: string, job: WorkflowJob | undefined) => {
  const steps = job?.steps;
  assert.ok(Array.isArray(steps), `${jobName} must define a steps array`);

  const setupNode = getSetupNodeStep(steps);
  assert.ok(setupNode, `${jobName} must configure actions/setup-node`);
  assert.equal(setupNode.with?.cache, "pnpm", `${jobName} must cache the pnpm store`);
  assert.equal(
    setupNode.with?.["cache-dependency-path"],
    "pnpm-lock.yaml",
    `${jobName} must key pnpm cache with pnpm-lock.yaml`,
  );
};

test("ci workflow defines the required pull request jobs and services", async () => {
  const workflow = await readWorkflow();
  const jobs = workflow.jobs ?? {};
  assertRequiredJobs(jobs);
  assertWorkflowMetadata(workflow);
  assertIntegrationServices(jobs);

  for (const jobName of requiredJobNames) {
    assertJobCachesPnpmStore(jobName, jobs[jobName]);
  }
});
