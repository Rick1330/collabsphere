import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const runnerDir = path.join(repoRoot, ".tmp", "aca-bootstrap");
const args = new Set(process.argv.slice(2));
const buildAndPush = args.has("--build-and-push");
const dryRun = args.has("--dry-run");
const windowsQuotedQuote = String.raw`\"`;
const azureCliWindowsPath = String.raw`C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd`;

const quoteWindowsArg = (value) => `"${String(value).replaceAll("\"", windowsQuotedQuote)}"`;

const execCommand = (command, commandArgs, options = {}) => {
  if (process.platform === "win32") {
    const commandLine = `""${command}" ${commandArgs.map(quoteWindowsArg).join(" ")}`.trim();
    return execFileSync("cmd.exe", [
      "/d",
      "/s",
      "/c",
      commandLine,
    ], {
      cwd: repoRoot,
      ...options,
    });
  }

  return execFileSync(command, commandArgs, {
    cwd: repoRoot,
    ...options,
  });
};

const run = (command, commandArgs, options = {}) => {
  const { displayArgs = commandArgs, ...execOptions } = options;
  console.log(`> ${command} ${displayArgs.join(" ")}`);
  return execCommand(command, commandArgs, {
    stdio: "inherit",
    ...execOptions,
  });
};

const readText = (relativePath) => readFile(path.join(repoRoot, relativePath), "utf8");

const platformEnv = {
  resourceGroup: process.env.AZURE_RESOURCE_GROUP,
  location: process.env.AZURE_LOCATION,
  environmentId: process.env.AZURE_MANAGED_ENVIRONMENT_ID,
  registryServer: process.env.AZURE_CONTAINER_REGISTRY_LOGIN_SERVER,
  registryName: process.env.AZURE_CONTAINER_REGISTRY_NAME,
  registryUsername: process.env.AZURE_ACR_USERNAME,
  registryPassword: process.env.AZURE_ACR_PASSWORD,
  imageTag: process.env.IMAGE_TAG,
  migrationsJobName: process.env.AZURE_MIGRATIONS_JOB_NAME ?? "collabsphere-migrations-stg",
  apiName: process.env.AZURE_API_CONTAINERAPP_NAME ?? "collabsphere-api-stg",
  collabName: process.env.AZURE_COLLAB_CONTAINERAPP_NAME ?? "collabsphere-collab-stg",
  workerName: process.env.AZURE_WORKER_CONTAINERAPP_NAME ?? "collabsphere-worker-stg",
  s3AuthIdRef: process.env.AZURE_S3_AUTH_ID_REF ?? "s3-access-key-id",
  s3AuthValueRef: process.env.AZURE_S3_AUTH_VALUE_REF ?? "s3-secret-access-key",
};

const secretSpecs = [
  { envName: "AZURE_ACR_PASSWORD", secretName: "acr-password" },
  { envName: "DATABASE_URL", secretName: "database-url" },
  { envName: "REDIS_URL", secretName: "redis-url" },
  { envName: "JWT_ACCESS_SECRET", secretName: "jwt-access-secret" },
  { envName: "CORS_ORIGINS", secretName: "cors-origins" },
  { envName: "EMAIL_PROVIDER_API_KEY", secretName: "email-provider-key" },
  { envName: "API_BASE_URL", secretName: "api-base-url" },
  { envName: "BASE_URL", secretName: "base-url" },
  { envName: "COLLAB_DATABASE_URL", secretName: "collab-database-url" },
  { envName: "COLLAB_JWT_SECRET", secretName: "collab-jwt-secret" },
  { envName: "COLLAB_WS_URL", secretName: "collab-ws-url" },
  { envName: "S3_BUCKET", secretName: "s3-bucket" },
  { envName: "S3_ACCESS_KEY_ID", secretName: platformEnv.s3AuthIdRef },
  { envName: "S3_SECRET_ACCESS_KEY", secretName: platformEnv.s3AuthValueRef },
  { envName: "S3_REGION", secretName: "s3-region" },
];

const requiredPlatformVars = [
  ["AZURE_RESOURCE_GROUP", platformEnv.resourceGroup],
  ["AZURE_LOCATION", platformEnv.location],
  ["AZURE_MANAGED_ENVIRONMENT_ID", platformEnv.environmentId],
  ["AZURE_CONTAINER_REGISTRY_LOGIN_SERVER", platformEnv.registryServer],
  ["AZURE_CONTAINER_REGISTRY_NAME", platformEnv.registryName],
  ["AZURE_ACR_USERNAME", platformEnv.registryUsername],
  ["AZURE_ACR_PASSWORD", platformEnv.registryPassword],
  ["IMAGE_TAG", platformEnv.imageTag],
];

const missingPlatform = requiredPlatformVars
  .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
  .map(([name]) => name);

const missingSecrets = secretSpecs
  .filter(({ envName }) => {
    const value = process.env[envName];
    return typeof value !== "string" || value.trim().length === 0;
  })
  .map(({ envName }) => envName);

if (missingPlatform.length > 0 || missingSecrets.length > 0) {
  const parts = [];
  if (missingPlatform.length > 0) {
    parts.push(`platform vars: ${missingPlatform.join(", ")}`);
  }
  if (missingSecrets.length > 0) {
    parts.push(`runtime vars: ${missingSecrets.join(", ")}`);
  }
  throw new Error(`Missing bootstrap inputs: ${parts.join(" | ")}`);
}

const renderTemplate = async (relativePath, substitutions) => {
  const source = await readText(relativePath);
  let output = source;

  for (const [needle, replacement] of substitutions) {
    output = output.split(needle).join(replacement);
  }

  const unresolved = [...new Set(output.match(/__[A-Z0-9_]+__/g) ?? [])];
  if (unresolved.length > 0) {
    throw new Error(`Unresolved placeholders in ${relativePath}: ${unresolved.join(", ")}`);
  }

  return output;
};

const indentBlock = (text, spaces) =>
  text
    .split("\n")
    .map((line) => `${" ".repeat(spaces)}${line}`)
    .join("\n");

const secretPairs = secretSpecs.map(({ envName, secretName }) => ({
  secretName,
  value: process.env[envName],
}));

const secretArgs = secretPairs.map(({ secretName, value }) => `${secretName}=${value}`);
const redactedSecretArgs = secretPairs.map(({ secretName }) => `${secretName}=***`);

const createSecretsYamlBlock = () =>
  secretPairs.map(({ secretName, value }) => `- name: ${secretName}\n  value: ${JSON.stringify(value)}`).join("\n");

const withInlineSecrets = (renderedYaml) => {
  const block = indentBlock(createSecretsYamlBlock(), 4);
  return renderedYaml.replace(
    / {2}configuration:\r?\n/,
    (match) => `${match}    secrets:\n${block}\n`,
  );
};

const substitutions = new Map([
  ["__LOCATION__", platformEnv.location],
  ["__MANAGED_ENVIRONMENT_ID__", platformEnv.environmentId],
  ["__REGISTRY_SERVER__", platformEnv.registryServer],
  ["__ACR_USERNAME__", platformEnv.registryUsername],
  ["__IMAGE_TAG__", platformEnv.imageTag],
  ["__MIGRATIONS_JOB_NAME__", platformEnv.migrationsJobName],
  ["__MIGRATIONS_IMAGE__", "collabsphere-api"],
  ["__API_CONTAINERAPP_NAME__", platformEnv.apiName],
  ["__COLLAB_CONTAINERAPP_NAME__", platformEnv.collabName],
  ["__WORKER_CONTAINERAPP_NAME__", platformEnv.workerName],
  ["__S3_AUTH_ID_REF__", platformEnv.s3AuthIdRef],
  ["__S3_AUTH_VALUE_REF__", platformEnv.s3AuthValueRef],
]);

const appConfigs = [
  {
    name: platformEnv.apiName,
    template: "infra/azure/container-apps/api.containerapp.yaml",
  },
  {
    name: platformEnv.collabName,
    template: "infra/azure/container-apps/collab.containerapp.yaml",
  },
  {
    name: platformEnv.workerName,
    template: "infra/azure/container-apps/worker.containerapp.yaml",
  },
];
const backendServices = ["api", "collab", "worker"];

const azureCli = process.platform === "win32" ? azureCliWindowsPath : "az";

const resourceExists = (argsToRun) => {
  try {
    execCommand(azureCli, argsToRun, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
};

const buildAndPushBackendImages = () => {
  for (const service of backendServices) {
    run("pnpm", ["--filter", `@collabsphere/${service}`, "run", "build"]);
  }

  run(azureCli, ["acr", "login", "--name", platformEnv.registryName]);

  for (const service of backendServices) {
    const imageRef = `${platformEnv.registryServer}/collabsphere-${service}:${platformEnv.imageTag}`;
    run("docker", [
      "build",
      "--file",
      "infra/azure/container-apps/backend-service.Dockerfile",
      "--build-arg",
      `APP_DIR=apps/${service}`,
      "--tag",
      imageRef,
      ".",
    ]);
    run("docker", ["push", imageRef]);
  }
};

const renderBootstrapManifest = async (templatePath, outputName) => {
  const rendered = await renderTemplate(templatePath, substitutions);
  const manifestPath = path.join(runnerDir, `${outputName}.yaml`);
  await writeFile(manifestPath, withInlineSecrets(rendered), "utf8");
  return manifestPath;
};

const upsertContainerResource = ({ kind, name, manifestPath }) => {
  const resourceSegments = kind === "job" ? ["containerapp", "job"] : ["containerapp"];
  const existsArgs = [...resourceSegments, "show", "--name", name, "--resource-group", platformEnv.resourceGroup];
  const secretArgsToRun = [...resourceSegments, "secret", "set", "--name", name, "--resource-group", platformEnv.resourceGroup, "--secrets", ...secretArgs];
  const redactedSecretArgsToRun = [...resourceSegments, "secret", "set", "--name", name, "--resource-group", platformEnv.resourceGroup, "--secrets", ...redactedSecretArgs];
  const updateArgs = [...resourceSegments, "update", "--name", name, "--resource-group", platformEnv.resourceGroup, "--yaml", manifestPath];
  const createArgs = [...resourceSegments, "create", "--name", name, "--resource-group", platformEnv.resourceGroup, "--yaml", manifestPath];

  if (resourceExists(existsArgs)) {
    run(azureCli, secretArgsToRun, { displayArgs: redactedSecretArgsToRun });
    run(azureCli, updateArgs);
    return;
  }

  run(azureCli, createArgs);
};

const bootstrapApps = async () => {
  for (const app of appConfigs) {
    const manifestPath = await renderBootstrapManifest(app.template, app.name);

    if (dryRun) {
      console.log(`[dry-run] rendered app bootstrap manifest ${manifestPath}`);
      continue;
    }

    upsertContainerResource({
      kind: "app",
      name: app.name,
      manifestPath,
    });
  }
};

const bootstrapJob = async () => {
  const manifestPath = await renderBootstrapManifest(
    "infra/azure/container-apps/migrations.job.yaml",
    platformEnv.migrationsJobName,
  );

  if (dryRun) {
    console.log(`[dry-run] rendered job bootstrap manifest ${manifestPath}`);
    console.log("ACA staging bootstrap dry run completed.");
    return;
  }

  upsertContainerResource({
    kind: "job",
    name: platformEnv.migrationsJobName,
    manifestPath,
  });
};

const bootstrap = async () => {
  await rm(runnerDir, { recursive: true, force: true });
  await mkdir(runnerDir, { recursive: true });

  if (buildAndPush) {
    buildAndPushBackendImages();
  }

  await bootstrapApps();
  await bootstrapJob();

  if (dryRun) {
    return;
  }

  console.log("ACA staging bootstrap completed.");
  console.log(`Apps: ${platformEnv.apiName}, ${platformEnv.collabName}, ${platformEnv.workerName}`);
  console.log(`Job: ${platformEnv.migrationsJobName}`);
};

try {
  await bootstrap();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
