import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type DeployEnvironment = "staging" | "production";

type CorsRule = {
  id?: string;
  allowed: {
    origins: string[];
    methods: Array<"GET" | "PUT" | "POST" | "DELETE" | "HEAD">;
    headers?: string[];
  };
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
};

type BucketRecord = {
  name?: string;
};

type CustomDomainRecord = {
  domain?: string;
  enabled?: boolean;
  status?: {
    ownership?: string;
    ssl?: string;
  };
};

type ApiEnvelope<T> = {
  success?: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  messages?: string[];
  result?: T;
};

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const args = new Set(process.argv.slice(2));
const rawArgs = process.argv.slice(2);
const dryRun = args.has("--dry-run");

const supportedEnvironments = new Set<DeployEnvironment>(["staging", "production"]);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const runnerDir = path.join(repoRoot, ".tmp", "r2-bootstrap");
const pnpmCommand =
  process.platform === "win32" ? path.join(path.dirname(process.execPath), "pnpm.cmd") : "pnpm";

const readArgValue = (name: string) => {
  const index = rawArgs.findIndex((arg) => arg === name);
  return index >= 0 ? rawArgs[index + 1] : undefined;
};

const resolveEnvironment = (): DeployEnvironment => {
  const candidate = (process.env.DEPLOY_ENVIRONMENT ?? readArgValue("--environment") ?? "staging")
    .trim()
    .toLowerCase() as DeployEnvironment;

  if (!supportedEnvironments.has(candidate)) {
    throw new Error(`Unsupported deploy environment "${candidate}". Use staging or production.`);
  }

  return candidate;
};

const deployEnvironment = resolveEnvironment();
const envKey = deployEnvironment.toUpperCase();

const readScopedEnv = (baseName: string) =>
  process.env[`CLOUDFLARE_R2_${envKey}_${baseName}`] ?? process.env[`CLOUDFLARE_R2_${baseName}`];

const normalizeList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const required = (name: string, value: string | undefined) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return value.trim();
};

const quotePowerShellArg = (value: string) => `'${String(value).replaceAll("'", "''")}'`;
const normalizeOutput = (value: string | Buffer | null | undefined) =>
  Buffer.isBuffer(value) ? value.toString("utf8").trim() : String(value ?? "").trim();
const createCommandResult = (
  status: number | null | undefined,
  stdout: string | Buffer | null | undefined,
  stderr: string | Buffer | null | undefined,
): CommandResult => ({
  status: typeof status === "number" ? status : 1,
  stdout: normalizeOutput(stdout),
  stderr: normalizeOutput(stderr),
});
const matchesWranglerListEntry = (output: string, expected: string) => {
  const normalizedExpected = expected.trim().toLowerCase();
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0]?.toLowerCase() ?? "")
    .some((candidate) => candidate === normalizedExpected);
};

const providedAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || "";
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() || "";
const authMode = apiToken ? "api-token" : "wrangler-oauth";
const bucketName = required(
  `CLOUDFLARE_R2_${envKey}_BUCKET_NAME or CLOUDFLARE_R2_BUCKET_NAME`,
  readScopedEnv("BUCKET_NAME"),
);
const customDomain = readScopedEnv("CUSTOM_DOMAIN")?.trim() || "";
const zoneId = readScopedEnv("ZONE_ID")?.trim() || "";
const jurisdiction = (readScopedEnv("JURISDICTION")?.trim() || "default") as
  | "default"
  | "eu"
  | "fedramp";
const allowedOrigins = normalizeList(readScopedEnv("ALLOWED_ORIGINS"));
const allowedMethods = (normalizeList(readScopedEnv("ALLOWED_METHODS")).length > 0
  ? normalizeList(readScopedEnv("ALLOWED_METHODS"))
  : ["GET", "PUT", "HEAD", "DELETE"]) as Array<"GET" | "PUT" | "POST" | "DELETE" | "HEAD">;
const allowedHeaders = normalizeList(readScopedEnv("ALLOWED_HEADERS"));
const exposeHeaders = normalizeList(readScopedEnv("EXPOSE_HEADERS"));
const maxAgeSecondsRaw = readScopedEnv("MAX_AGE_SECONDS");
const maxAgeSeconds =
  typeof maxAgeSecondsRaw === "string" && maxAgeSecondsRaw.trim().length > 0
    ? Number.parseInt(maxAgeSecondsRaw, 10)
    : 3600;
const locationHint = readScopedEnv("LOCATION_HINT")?.trim() || "";

if (customDomain && !zoneId) {
  throw new Error(
    `CLOUDFLARE_R2_${envKey}_ZONE_ID or CLOUDFLARE_R2_ZONE_ID is required when a custom domain is configured.`,
  );
}

if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) {
  throw new Error("R2 CORS max age must be a non-negative integer.");
}

let discoveredAccountId = providedAccountId;

const runWranglerViaPowerShell = (commandArgs: string[]): CommandResult => {
  const commandLine = `& ${quotePowerShellArg(pnpmCommand)} ${["dlx", "wrangler", ...commandArgs]
    .map(quotePowerShellArg)
    .join(" ")}`;

  try {
    const stdout = execFileSync("powershell.exe", ["-NoProfile", "-Command", commandLine], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });

    return createCommandResult(0, stdout, "");
  } catch (error) {
    const failedCommand = error as {
      status?: number | null;
      stdout?: string | Buffer | null;
      stderr?: string | Buffer | null;
    };
    return createCommandResult(failedCommand.status, failedCommand.stdout, failedCommand.stderr);
  }
};

const runWranglerViaSpawn = (commandArgs: string[]): CommandResult => {
  const result = spawnSync(pnpmCommand, ["dlx", "wrangler", ...commandArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  return createCommandResult(result.status, result.stdout, result.stderr);
};

const runWrangler = (commandArgs: string[]) => {
  if (process.platform === "win32") {
    return runWranglerViaPowerShell(commandArgs);
  }

  return runWranglerViaSpawn(commandArgs);
};

const runWranglerOrThrow = (commandArgs: string[]) => {
  const result = runWrangler(commandArgs);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `wrangler ${commandArgs.join(" ")} failed`);
  }
  return result.stdout;
};

const resolveAccountId = () => {
  if (discoveredAccountId) {
    return discoveredAccountId;
  }

  if (authMode === "api-token") {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required when using CLOUDFLARE_API_TOKEN.");
  }

  const output = runWranglerOrThrow(["whoami"]);
  const match = output.match(/\b[0-9a-f]{32}\b/i);
  if (!match) {
    throw new Error("Could not determine Cloudflare account ID from `wrangler whoami`.");
  }

  discoveredAccountId = match[0];
  return discoveredAccountId;
};

const buildBaseUrl = () => `https://api.cloudflare.com/client/v4/accounts/${resolveAccountId()}/r2/buckets`;

const createHeaders = () => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiToken}`);
  headers.set("Content-Type", "application/json");
  if (jurisdiction !== "default") {
    headers.set("cf-r2-jurisdiction", jurisdiction);
  }
  return headers;
};

const createCorsRules = (): CorsRule[] => {
  if (allowedOrigins.length === 0) {
    return [];
  }

  return [
    {
      id: `collabsphere-${deployEnvironment}-browser`,
      allowed: {
        origins: allowedOrigins,
        methods: allowedMethods,
        ...(allowedHeaders.length > 0 ? { headers: allowedHeaders } : {}),
      },
      ...(exposeHeaders.length > 0 ? { exposeHeaders } : {}),
      maxAgeSeconds,
    },
  ];
};

const readJson = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    const errorSummary = payload.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(
      errorSummary || `Cloudflare API request failed with HTTP ${response.status}.`,
    );
  }

  return payload;
};

const request = async <T>(path: string, options?: RequestInit) => {
  const response = await fetch(`${buildBaseUrl()}${path}`, {
    ...options,
    headers: createHeaders(),
  });
  return readJson<T>(response);
};

const createWranglerCorsFile = async () => {
  const rules = createCorsRules();
  await mkdir(runnerDir, { recursive: true });
  const corsFilePath = path.join(runnerDir, `${deployEnvironment}.cors.json`);
  await writeFile(corsFilePath, `${JSON.stringify({ rules }, null, 2)}\n`, "utf8");
  return corsFilePath;
};

const ensureBucketViaWrangler = async () => {
  if (dryRun) {
    console.log(
      `[dry-run] ensure R2 bucket ${bucketName} via Wrangler OAuth${locationHint ? ` (location=${locationHint})` : ""} (jurisdiction=${jurisdiction})`,
    );
    return;
  }

  const listOutput = runWranglerOrThrow(["r2", "bucket", "list"]);
  if (matchesWranglerListEntry(listOutput, bucketName)) {
    console.log(`R2 bucket already exists: ${bucketName}`);
    return;
  }

  const createArgs = ["r2", "bucket", "create", bucketName, "--jurisdiction", jurisdiction];
  if (locationHint) {
    createArgs.push("--location", locationHint);
  }

  runWranglerOrThrow(createArgs);
  console.log(`Created R2 bucket via Wrangler: ${bucketName}`);
};

const ensureCorsViaWrangler = async () => {
  const rules = createCorsRules();

  if (rules.length === 0) {
    console.log("No R2 CORS origins configured; skipping CORS policy update.");
    return;
  }

  const corsFilePath = await createWranglerCorsFile();

  if (dryRun) {
    console.log(
      `[dry-run] apply R2 CORS policy via Wrangler to ${bucketName} from ${corsFilePath}`,
    );
    return;
  }

  runWranglerOrThrow([
    "r2",
    "bucket",
    "cors",
    "set",
    bucketName,
    "--file",
    corsFilePath,
    "--jurisdiction",
    jurisdiction,
    "--force",
  ]);
  console.log(`Applied R2 CORS policy via Wrangler to bucket: ${bucketName}`);
};

const ensureCustomDomainViaWrangler = async () => {
  if (!customDomain) {
    console.log("No R2 custom domain configured; skipping domain attachment.");
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] ensure R2 custom domain ${customDomain} via Wrangler for ${bucketName} using zone ${zoneId}`,
    );
    return;
  }

  const listOutput = runWranglerOrThrow([
    "r2",
    "bucket",
    "domain",
    "list",
    bucketName,
    "--jurisdiction",
    jurisdiction,
  ]);

  if (matchesWranglerListEntry(listOutput, customDomain)) {
    console.log(`R2 custom domain already exists: ${customDomain}`);
    return;
  }

  runWranglerOrThrow([
    "r2",
    "bucket",
    "domain",
    "add",
    bucketName,
    "--domain",
    customDomain,
    "--zone-id",
    zoneId,
    "--jurisdiction",
    jurisdiction,
    "--force",
  ]);
  console.log(`Attached R2 custom domain via Wrangler: ${customDomain}`);
};

const ensureBucket = async () => {
  if (authMode === "wrangler-oauth") {
    await ensureBucketViaWrangler();
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] ensure R2 bucket ${bucketName} (jurisdiction=${jurisdiction})`);
    return;
  }

  const existing = await request<{ buckets?: BucketRecord[] }>("", {
    method: "GET",
  });
  const hasBucket =
    existing.result?.buckets?.some((bucket) => bucket.name?.toLowerCase() === bucketName.toLowerCase()) ??
    false;

  if (hasBucket) {
    console.log(`R2 bucket already exists: ${bucketName}`);
    return;
  }

  await request<BucketRecord>("", {
    method: "POST",
    body: JSON.stringify({
      name: bucketName,
      jurisdiction,
    }),
  });
  console.log(`Created R2 bucket: ${bucketName}`);
};

const ensureCors = async () => {
  if (authMode === "wrangler-oauth") {
    await ensureCorsViaWrangler();
    return;
  }

  const rules = createCorsRules();

  if (rules.length === 0) {
    console.log("No R2 CORS origins configured; skipping CORS policy update.");
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] apply R2 CORS policy to ${bucketName}: ${JSON.stringify({ rules }, null, 2)}`,
    );
    return;
  }

  await request<object>(`/${bucketName}/cors`, {
    method: "PUT",
    body: JSON.stringify({ rules }),
  });
  console.log(`Applied R2 CORS policy to bucket: ${bucketName}`);
};

const ensureCustomDomain = async () => {
  if (authMode === "wrangler-oauth") {
    await ensureCustomDomainViaWrangler();
    return;
  }

  if (!customDomain) {
    console.log("No R2 custom domain configured; skipping domain attachment.");
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] ensure R2 custom domain ${customDomain} for ${bucketName} using zone ${zoneId}`,
    );
    return;
  }

  const existing = await request<{ domains?: CustomDomainRecord[] }>(`/${bucketName}/domains/custom`, {
    method: "GET",
  });
  const matched = existing.result?.domains?.find(
    (domain) => domain.domain?.toLowerCase() === customDomain.toLowerCase(),
  );

  if (matched) {
    console.log(
      `R2 custom domain already exists: ${customDomain} (ownership=${matched.status?.ownership ?? "unknown"})`,
    );
    return;
  }

  await request<object>(`/${bucketName}/domains/custom`, {
    method: "POST",
    body: JSON.stringify({
      domain: customDomain,
      enabled: true,
      zoneId,
    }),
  });
  console.log(`Attached R2 custom domain: ${customDomain}`);
};

const printSummary = () => {
  const accountId = providedAccountId || "(set CLOUDFLARE_ACCOUNT_ID to print the endpoint explicitly)";

  console.log("");
  console.log("R2 bootstrap summary");
  console.log(`- environment: ${deployEnvironment}`);
  console.log(`- auth mode: ${authMode}`);
  console.log(`- account id: ${accountId}`);
  console.log(`- bucket: ${bucketName}`);
  console.log(`- jurisdiction: ${jurisdiction}`);
  console.log(`- allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "(none)"}`);
  console.log(`- custom domain: ${customDomain || "(none)"}`);
  console.log("");
  console.log("Still required after this bootstrap");
  console.log("- R2 runtime access key pair for the application");
  console.log("- secret distribution to Azure staging and AWS production");
  console.log(
    accountId.startsWith("(")
      ? "- application endpoint wiring requires CLOUDFLARE_ACCOUNT_ID to render the exact S3_ENDPOINT"
      : `- application endpoint wiring with S3_ENDPOINT=https://${accountId}.r2.cloudflarestorage.com`,
  );
};

const main = async () => {
  await rm(runnerDir, { recursive: true, force: true });
  await ensureBucket();
  await ensureCors();
  await ensureCustomDomain();
  printSummary();
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
