import { spawnSync } from "node:child_process";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const rawArgs = process.argv.slice(2);

type AwsCommandResult = {
  status: number;
  stdout: string;
  stderr: string;
  error: string;
};

type ClusterDescription = {
  clusterName?: string;
};

type ClusterFailure = {
  reason?: string;
};

type DescribeClustersResponse = {
  clusters?: ClusterDescription[];
  failures?: ClusterFailure[];
};

type DescribeLogGroupsResponse = {
  logGroups?: Array<{
    logGroupName?: string;
  }>;
};

const supportedEnvironments = new Set(["production"]);

const resolveEnvironment = () => {
  const environmentArgIndex = rawArgs.findIndex((arg) => arg === "--environment");
  const environmentArgValue =
    environmentArgIndex >= 0 ? rawArgs[environmentArgIndex + 1] : undefined;
  const candidate = (environmentArgValue ?? process.env.DEPLOY_ENVIRONMENT ?? "production")
    .trim()
    .toLowerCase();

  if (!supportedEnvironments.has(candidate)) {
    throw new Error(`Unsupported deploy environment "${candidate}". Use production.`);
  }

  return candidate;
};

const deployEnvironment = resolveEnvironment();
const dryRun = args.has("--dry-run");
const region = process.env.AWS_REGION ?? "eu-central-1";
const profile = process.env.AWS_PROFILE ?? "";
const awsExecutable =
  process.env.AWS_CLI_PATH?.trim() ||
  (process.platform === "win32"
    ? path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Amazon", "AWSCLIV2", "aws.exe")
    : "/usr/bin/aws");
if (!path.isAbsolute(awsExecutable)) {
  throw new Error("AWS_CLI_PATH must be an absolute path when provided.");
}
const clusterName = process.env.AWS_ECS_CLUSTER_NAME ?? "collabsphere-production";
const services = [
  {
    service: "api",
    repository: process.env.AWS_ECR_REPOSITORY_API ?? "collabsphere-api",
    logGroup: process.env.AWS_LOG_GROUP_API ?? "/ecs/collabsphere-production/api",
  },
  {
    service: "collab",
    repository: process.env.AWS_ECR_REPOSITORY_COLLAB ?? "collabsphere-collab",
    logGroup: process.env.AWS_LOG_GROUP_COLLAB ?? "/ecs/collabsphere-production/collab",
  },
  {
    service: "worker",
    repository: process.env.AWS_ECR_REPOSITORY_WORKER ?? "collabsphere-worker",
    logGroup: process.env.AWS_LOG_GROUP_WORKER ?? "/ecs/collabsphere-production/worker",
  },
] as const;

const parseJson = <T>(value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const runAws = (commandArgs: string[]) => {
  const profileArgs = profile ? ["--profile", profile] : [];
  const result = spawnSync(awsExecutable, [...commandArgs, "--region", region, ...profileArgs], {
    stdio: "pipe",
    encoding: "utf8",
  });

  return {
    status: result.status ?? 1,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
    error: result.error?.message ?? "",
  } satisfies AwsCommandResult;
};

const runAwsOrThrow = (commandArgs: string[]) => {
  const result = runAws(commandArgs);
  if (result.error) {
    throw new Error(`Failed to run aws ${commandArgs.join(" ")}: ${result.error}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `aws ${commandArgs.join(" ")} failed`);
  }
  return result.stdout;
};

const logPlannedAction = (message: string) => {
  if (dryRun) {
    console.log(`[dry-run] ${message}`);
    return;
  }

  console.log(message);
};

const clusterExists = () => {
  const describe = runAws(["ecs", "describe-clusters", "--clusters", clusterName, "--output", "json"]);
  if (describe.status !== 0) {
    return false;
  }

  const payload = parseJson<DescribeClustersResponse>(describe.stdout);
  const hasCluster =
    payload?.clusters?.some((cluster) => cluster.clusterName === clusterName) ?? false;
  const isMissing =
    payload?.failures?.some((failure) => failure.reason === "MISSING") ?? false;

  return hasCluster && !isMissing;
};

const ensureCluster = () => {
  if (clusterExists()) {
    console.log(`ECS cluster already exists: ${clusterName}`);
    return;
  }

  logPlannedAction(`Create ECS cluster ${clusterName}`);
  if (!dryRun) {
    runAwsOrThrow(["ecs", "create-cluster", "--cluster-name", clusterName, "--output", "json"]);
  }
};

const ensureRepository = (repositoryName: string) => {
  const describe = runAws([
    "ecr",
    "describe-repositories",
    "--repository-names",
    repositoryName,
    "--output",
    "json",
  ]);
  if (describe.status === 0) {
    console.log(`ECR repository already exists: ${repositoryName}`);
    return;
  }

  logPlannedAction(`Create ECR repository ${repositoryName}`);
  if (!dryRun) {
    runAwsOrThrow([
      "ecr",
      "create-repository",
      "--repository-name",
      repositoryName,
      "--image-tag-mutability",
      "MUTABLE",
      "--image-scanning-configuration",
      "scanOnPush=true",
      "--output",
      "json",
    ]);
  }
};

const ensureLogGroup = (logGroupName: string) => {
  const existing = runAws([
    "logs",
    "describe-log-groups",
    "--log-group-name-prefix",
    logGroupName,
    "--output",
    "json",
  ]);
  const payload = parseJson<DescribeLogGroupsResponse>(existing.stdout);
  const hasExactLogGroup =
    existing.status === 0 &&
    (payload?.logGroups?.some((logGroup) => logGroup.logGroupName === logGroupName) ?? false);

  if (hasExactLogGroup) {
    console.log(`CloudWatch log group already exists: ${logGroupName}`);
    return;
  }

  logPlannedAction(`Create CloudWatch log group ${logGroupName}`);
  if (!dryRun) {
    runAwsOrThrow(["logs", "create-log-group", "--log-group-name", logGroupName]);
  }
};

const printNextSteps = () => {
  console.log("");
  console.log("Bootstrap summary");
  console.log(`- environment: ${deployEnvironment}`);
  console.log(`- region: ${region}`);
  console.log(`- ecs cluster: ${clusterName}`);
  for (const service of services) {
    console.log(`- ecr repo (${service.service}): ${service.repository}`);
    console.log(`- log group (${service.service}): ${service.logGroup}`);
  }
  console.log("");
  console.log("Still required after this bootstrap");
  console.log("- ECS services and task definitions");
  console.log("- ALB / listeners / target groups for api and collab");
  console.log("- managed PostgreSQL and Redis");
  console.log("- GitHub Actions OIDC role for AWS deploys");
};

const main = () => {
  ensureCluster();
  for (const service of services) {
    ensureRepository(service.repository);
    ensureLogGroup(service.logGroup);
  }
  printNextSteps();
};

main();
