import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePackageRoot = resolve(repoRoot, "packages", "database");
const defaultSchemaPath = resolve(databasePackageRoot, "prisma", "schema.prisma");

const parseEnvFile = (filePath) => {
  const parsed = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
};

const loadLocalEnv = () => {
  const loaded = {};

  for (const relativePath of [".env", ".env.local"]) {
    const absolutePath = resolve(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    Object.assign(loaded, parseEnvFile(absolutePath));
  }

  return {
    ...process.env,
    ...loaded,
  };
};

const extractOptionValue = (args, optionName) => {
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === optionName) {
      return args[index + 1];
    }

    if (value.startsWith(`${optionName}=`)) {
      return value.slice(optionName.length + 1);
    }
  }

  return undefined;
};

const buildDryRunCompatArgs = (args) => {
  const schemaArg = extractOptionValue(args, "--schema");
  const schemaPath = schemaArg ? resolve(repoRoot, schemaArg) : defaultSchemaPath;

  return [
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    schemaPath,
    "--script",
  ];
};

const rawArgs = process.argv.slice(2);
const useDryRunCompat =
  rawArgs[0] === "migrate" && rawArgs[1] === "dev" && rawArgs.includes("--dry-run");

if (useDryRunCompat) {
  process.stderr.write(
    "[prisma] Translating unsupported `migrate dev --dry-run` to a read-only schema diff.\n",
  );
}

const prismaArgs = useDryRunCompat ? buildDryRunCompatArgs(rawArgs) : rawArgs;
const result = spawnSync("pnpm", ["exec", "prisma", ...prismaArgs], {
  cwd: databasePackageRoot,
  env: loadLocalEnv(),
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
