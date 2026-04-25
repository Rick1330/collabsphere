import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const stagingWorkflowPath = path.join(repoRoot, ".github", "workflows", "deploy.yml");
const productionWorkflowPath = path.join(
  repoRoot,
  ".github",
  "workflows",
  "deploy-production-aws.yml",
);

type WorkflowJob = {
  steps?: Array<Record<string, unknown>>;
  environment?: string;
};

type WorkflowShape = {
  name?: string;
  on?: {
    push?: {
      branches?: string[];
      tags?: string[];
    };
    workflow_dispatch?: unknown;
  };
  jobs?: Record<string, WorkflowJob>;
};

const readYamlWorkflow = async (workflowPath: string) =>
  parse(await readFile(workflowPath, "utf8")) as WorkflowShape;

const readWorkflowText = async (workflowPath: string) => readFile(workflowPath, "utf8");

const assertHasJobs = (workflow: WorkflowShape) => {
  const jobs = workflow.jobs ?? {};
  assert.ok(jobs["resolve-target"], "workflow must define resolve-target");
  assert.ok(jobs.build, "workflow must define build");
  assert.ok(jobs.deploy, "workflow must define deploy");
  assert.ok(jobs.notify, "workflow must define notify");
};

test("staging deploy workflow is staging-only and Azure-backed", async () => {
  const workflow = await readYamlWorkflow(stagingWorkflowPath);
  const text = await readWorkflowText(stagingWorkflowPath);

  assert.equal(workflow.name, "Deploy Staging");
  assert.deepEqual(workflow.on?.push?.branches, ["main"]);
  assert.equal(workflow.on?.push?.tags, undefined);
  assert.ok(workflow.on?.workflow_dispatch, "staging workflow must allow manual dispatch");
  assert.equal(workflow.jobs?.deploy?.environment, "staging");
  assertHasJobs(workflow);

  assert.match(text, /azure\/login@/);
  assert.doesNotMatch(text, /aws-actions\/configure-aws-credentials@/);
});

test("production deploy workflow is AWS-backed and tag/manual driven", async () => {
  const workflow = await readYamlWorkflow(productionWorkflowPath);
  const text = await readWorkflowText(productionWorkflowPath);

  assert.equal(workflow.name, "Deploy Production AWS");
  assert.deepEqual(workflow.on?.push?.tags, ["v*"]);
  assert.equal(workflow.on?.push?.branches, undefined);
  assert.ok(workflow.on?.workflow_dispatch, "production workflow must allow manual dispatch");
  assert.equal(workflow.jobs?.deploy?.environment, "production");
  assertHasJobs(workflow);

  assert.match(text, /aws-actions\/configure-aws-credentials@v4/);
  assert.match(text, /AWS_DEPLOY_ROLE_ARN/);
  assert.match(text, /DATABASE_URL/);
  assert.match(text, /Vercel web \+ AWS ECS backend/);
});
