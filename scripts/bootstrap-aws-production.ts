import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const rawArgs = process.argv.slice(2);

const supportedEnvironments = new Set(["production"]);

const resolveEnvironment = () => {
  const environmentArgIndex = rawArgs.findIndex((arg) => arg === "--environment");
  const environmentArgValue =
    environmentArgIndex >= 0 ? rawArgs[environmentArgIndex + 1] : undefined;
  const candidate = (process.env.DEPLOY_ENVIRONMENT ?? environmentArgValue ?? "production")
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

const runAws = (commandArgs: string[]) => {
  const profileArgs = profile ? ["--profile", profile] : [];
  const result = spawnSync("aws", [...commandArgs, "--region", region, ...profileArgs], {
    stdio: "pipe",
    encoding: "utf8",
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
};

const runAwsOrThrow = (commandArgs: string[]) => {
  const result = runAws(commandArgs);
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

const ensureCluster = () => {
  const describe = runAws(["ecs", "describe-clusters", "--clusters", clusterName, "--output", "json"]);
  if (
    describe.status === 0 &&
    describe.stdout.includes(`"clusterName": "${clusterName}"`) &&
    !describe.stdout.includes('"reason": "MISSING"')
  ) {
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
  if (existing.status === 0 && existing.stdout.includes(logGroupName)) {
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
