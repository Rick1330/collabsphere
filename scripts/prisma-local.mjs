import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePackageRoot = resolve(repoRoot, "packages", "database");
const defaultSchemaPath = resolve(databasePackageRoot, "prisma", "schema.prisma");

const isBlankOrComment = (line) => line.length === 0 || line.startsWith("#");

const isValidEnvKey = (value) => /^[A-Za-z_]\w*$/u.test(value);

const isSupportedQuote = (value) => value === '"' || value === "'";

const unwrapQuotedValue = (value) => {
  if (value.length < 2) {
    return value;
  }

  const quote = value.at(0);
  if (!isSupportedQuote(quote)) {
    return value;
  }

  if (value.at(-1) !== quote) {
    return value;
  }

  return value.slice(1, -1);
};

const parseEnvAssignment = (line) => {
  const separatorIndex = line.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = line.slice(0, separatorIndex).trim();
  if (!isValidEnvKey(key)) {
    return null;
  }

  return [key, unwrapQuotedValue(line.slice(separatorIndex + 1))];
};

const parseEnvFile = (filePath) => {
  const parsed = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();
    if (isBlankOrComment(trimmed)) {
      continue;
    }

    const entry = parseEnvAssignment(trimmed);
    if (!entry) {
      continue;
    }

    const [key, value] = entry;
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
