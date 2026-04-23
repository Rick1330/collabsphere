import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const envPath = join(rootDir, ".env");
const envLocalPath = join(rootDir, ".env.local");
const databasePackageDir = join(rootDir, "packages", "database");
const envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

const hasWrappedQuote = (value, quote) => value.startsWith(quote) && value.endsWith(quote);

const unquoteEnvValue = (value) => {
  for (const quote of ["\"", "'"]) {
    if (hasWrappedQuote(value, quote)) {
      return value.slice(1, -1);
    }
  }

  return value;
};

const skipLeadingSpaceOrTab = (value, startIndex) => {
  let index = startIndex;

  while (index < value.length) {
    const char = value[index];

    if (char !== " " && char !== "\t") {
      break;
    }

    index += 1;
  }

  return index;
};

const parseEnvAssignment = (rawLine) => {
  const line = rawLine.trim();

  if (!line || line.startsWith("#")) {
    return null;
  }

  const separatorIndex = rawLine.indexOf("=");

  if (separatorIndex <= 0) {
    throw new Error(`Invalid environment assignment: ${rawLine}`);
  }

  const key = rawLine.slice(0, separatorIndex).trim();
  const valueStart = skipLeadingSpaceOrTab(rawLine, separatorIndex + 1);
  const value = rawLine.slice(valueStart);

  if (!envKeyPattern.test(key)) {
    throw new Error(`Invalid environment key: ${key}`);
  }

  return [key, unquoteEnvValue(value)];
};

const parseEnvFile = (filePath) => {
  const values = {};
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const assignment = parseEnvAssignment(rawLine);

    if (!assignment) {
      continue;
    }

    const [key, value] = assignment;
    values[key] = value;
  }

  return values;
};

const sanitizeEnv = (values) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => envKeyPattern.test(key) && typeof value === "string"
    )
  );

const loadLocalEnv = () => {
  const env = { ...process.env };

  if (existsSync(envPath)) {
    Object.assign(env, parseEnvFile(envPath));
  }

  if (existsSync(envLocalPath)) {
    Object.assign(env, parseEnvFile(envLocalPath));
  }

  return sanitizeEnv(env);
};

const resolvePrismaRunner = () => {
  const npmExecPath = process.env.npm_execpath;

  if (typeof npmExecPath === "string" && npmExecPath.toLowerCase().includes("pnpm")) {
    return {
      command: process.execPath,
      runnerArgs: [npmExecPath, "exec", "prisma"]
    };
  }

  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    runnerArgs: ["exec", "prisma"]
  };
};

const args = process.argv.slice(2);
const prismaRunner = resolvePrismaRunner();

const child = spawn(prismaRunner.command, [...prismaRunner.runnerArgs, ...args], {
  cwd: databasePackageDir,
  env: loadLocalEnv(),
  stdio: "inherit",
  windowsHide: false
});

child.once("error", (error) => {
  if (error.code === "ENOENT") {
    console.error("[prisma-local] Unable to find Prisma on PATH. Run this command via pnpm.");
    process.exit(1);
  }

  console.error(`[prisma-local] ${error.message}`);
  process.exit(1);
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
