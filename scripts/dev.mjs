import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const envExamplePath = join(rootDir, ".env.example");
const envPath = join(rootDir, ".env");
const envLocalPath = join(rootDir, ".env.local");
const composeFilePath = join(rootDir, "docker-compose.yml");
const envAssignmentPattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/;

const integerEnvKeys = new Set([
  "POSTGRES_PORT",
  "REDIS_PORT",
  "MAILHOG_SMTP_PORT",
  "MAILHOG_UI_PORT",
  "MINIO_API_PORT",
  "MINIO_CONSOLE_PORT",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS"
]);

const urlEnvKeys = new Set([
  "DATABASE_URL",
  "REDIS_URL",
  "API_BASE_URL",
  "BASE_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
  "COLLAB_WS_URL",
  "S3_ENDPOINT"
]);

const appSurfaces = [
  {
    label: "web",
    filter: "@collabsphere/web",
    packageJsonPath: join(rootDir, "apps", "web", "package.json")
  },
  {
    label: "api",
    filter: "@collabsphere/api",
    packageJsonPath: join(rootDir, "apps", "api", "package.json")
  },
  {
    label: "collab",
    filter: "@collabsphere/collab",
    packageJsonPath: join(rootDir, "apps", "collab", "package.json")
  },
  {
    label: "worker",
    filter: "@collabsphere/worker",
    packageJsonPath: join(rootDir, "apps", "worker", "package.json")
  }
];

const logInfo = (message) => {
  console.log(`[dev] ${message}`);
};

const logWarn = (message) => {
  console.warn(`[dev] ${message}`);
};

const logError = (message) => {
  console.error(`[dev] ${message}`);
};

const exitWithHelp = (code = 0) => {
  console.log(`Usage: pnpm dev [--skip-compose]

Options:
  --skip-compose  Reuse existing Docker services and skip docker compose startup.
  --help          Show this help text.
`);
  process.exit(code);
};

const parseArgs = (argv) => {
  let skipCompose = false;

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    }

    if (arg === "--skip-compose") {
      skipCompose = true;
      continue;
    }

    if (arg === "--help") {
      exitWithHelp(0);
    }

    throw new Error(`Unknown argument "${arg}". Use --help for supported options.`);
  }

  return { skipCompose };
};

const unquoteEnvValue = (value) => {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const parseEnvAssignment = (rawLine, lineNumber, label) => {
  const line = rawLine.trim();

  if (!line || line.startsWith("#")) {
    return null;
  }

  const match = rawLine.match(envAssignmentPattern);

  if (!match) {
    throw new Error(`${label} has an invalid assignment on line ${lineNumber}.`);
  }

  const [, key, value] = match;
  return [key, unquoteEnvValue(value)];
};

const parseEnvFile = (filePath, label) => {
  const content = readFileSync(filePath, "utf8");
  const values = {};
  const lines = content.split(/\r?\n/);

  for (const [index, rawLine] of lines.entries()) {
    const assignment = parseEnvAssignment(rawLine, index + 1, label);

    if (!assignment) {
      continue;
    }

    const [key, value] = assignment;
    values[key] = value;
  }

  return values;
};

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

const validateIntegerValue = (key, value) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${key} must be a positive integer in .env or .env.local.`);
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${key} must be between 1 and 65535 in .env or .env.local.`);
  }
};

const validateUrlValue = (key, value) => {
  try {
    new URL(value);
  } catch {
    throw new Error(`${key} must be a valid absolute URL in .env or .env.local.`);
  }
};

const validateCorsOrigins = (value) => {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("CORS_ORIGINS must include at least one origin.");
  }

  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS contains an invalid origin "${origin}".`);
    }
  }
};

const ensureRequiredEnvFiles = () => {
  if (!existsSync(envExamplePath)) {
    throw new Error("Missing .env.example; cannot validate local startup configuration.");
  }

  if (!existsSync(envPath)) {
    throw new Error("Missing .env. Copy .env.example to .env before running pnpm dev.");
  }
};

const loadEnvSources = () => ({
  exampleValues: parseEnvFile(envExamplePath, ".env.example"),
  envValues: parseEnvFile(envPath, ".env"),
  envLocalValues: existsSync(envLocalPath) ? parseEnvFile(envLocalPath, ".env.local") : {}
});

const validateRequiredKeys = (exampleValues, localValues) => {
  const missingKeys = Object.keys(exampleValues).filter((key) => !hasValue(localValues[key]));

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required local environment keys: ${missingKeys.join(", ")}. ` +
        "Use .env.example as the reference and keep .env in sync."
    );
  }
};

const validateKnownEnvValues = (values) => {
  for (const [key, value] of Object.entries(values)) {
    if (!hasValue(value)) {
      continue;
    }

    if (integerEnvKeys.has(key)) {
      validateIntegerValue(key, value);
    }

    if (urlEnvKeys.has(key)) {
      validateUrlValue(key, value);
    }

    if (key === "CORS_ORIGINS") {
      validateCorsOrigins(value);
    }
  }
};

const loadValidatedEnv = () => {
  ensureRequiredEnvFiles();
  const { exampleValues, envValues, envLocalValues } = loadEnvSources();
  const appLocalValues = {
    ...envValues,
    ...envLocalValues
  };

  validateRequiredKeys(exampleValues, appLocalValues);
  validateKnownEnvValues(envValues);
  validateKnownEnvValues(appLocalValues);

  return {
    // Compose follows repo-local .env, while app children can layer runtime-only .env.local overrides.
    composeEnv: {
      ...process.env,
      ...envValues
    },
    appEnv: {
      ...process.env,
      ...appLocalValues
    }
  };
};

const ensureAppSurfaces = () => {
  for (const surface of appSurfaces) {
    if (!existsSync(surface.packageJsonPath)) {
      throw new Error(`Missing package manifest for ${surface.label}: ${surface.packageJsonPath}`);
    }

    const manifest = JSON.parse(readFileSync(surface.packageJsonPath, "utf8"));

    if (!manifest.scripts || typeof manifest.scripts.dev !== "string" || !manifest.scripts.dev.trim()) {
      throw new Error(`Package ${surface.filter} is missing a runnable scripts.dev entry.`);
    }
  }
};

const resolvePnpmRunner = () => {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath && basename(npmExecPath).toLowerCase().includes("pnpm")) {
    return {
      command: process.execPath,
      baseArgs: [npmExecPath]
    };
  }

  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    baseArgs: []
  };
};

const terminateChild = (child, label) =>
  new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const finish = () => resolve();
    child.once("exit", finish);

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true
      });

      killer.once("error", () => {
        logWarn(`failed to terminate ${label} with taskkill; waiting for it to exit`);
      });

      killer.once("exit", () => {
        setTimeout(resolve, 50);
      });
      return;
    }

    child.kill("SIGTERM");

    const forceKillTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }, 3000);

    child.once("exit", () => {
      clearTimeout(forceKillTimer);
      resolve();
    });
  });

const runCommand = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: "inherit",
      windowsHide: false
    });

    child.once("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`Unable to find "${command}" on PATH.`));
        return;
      }

      reject(error);
    });

    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${command} ${args.join(" ")} exited due to signal ${signal}.`
            : `${command} ${args.join(" ")} exited with code ${code}.`
        )
      );
    });
  });

const main = async () => {
  const { skipCompose } = parseArgs(process.argv.slice(2));

  if (!existsSync(composeFilePath) && !skipCompose) {
    throw new Error(`Missing docker-compose.yml at ${composeFilePath}`);
  }

  logInfo("validating local environment against .env.example");
  ensureAppSurfaces();
  const { composeEnv, appEnv } = loadValidatedEnv();
  const pnpmRunner = resolvePnpmRunner();
  const children = new Map();
  let shuttingDown = false;
  let settled = false;

  const finish = (exitCode) => {
    if (settled) {
      return;
    }

    settled = true;
    process.exit(exitCode);
  };

  const shutdown = async (reason, exitCode) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logInfo(reason);
    await Promise.allSettled(
      Array.from(children.entries(), ([label, child]) => terminateChild(child, label))
    );
    finish(exitCode);
  };

  process.once("SIGINT", () => {
    void shutdown("received SIGINT, stopping app processes", 0);
  });

  process.once("SIGTERM", () => {
    void shutdown("received SIGTERM, stopping app processes", 0);
  });

  if (skipCompose) {
    logWarn("skipping docker compose startup because --skip-compose was provided");
  } else {
    logInfo("ensuring docker compose services are up and healthy");
    await runCommand("docker", ["compose", "-f", composeFilePath, "up", "-d", "--wait"], {
      cwd: rootDir,
      env: composeEnv
    });
    logInfo("docker compose services are ready");
  }

  for (const surface of appSurfaces) {
    logInfo(`starting ${surface.label} via pnpm --filter ${surface.filter} run dev`);

    const child = spawn(
      pnpmRunner.command,
      [...pnpmRunner.baseArgs, "--filter", surface.filter, "run", "dev"],
      {
        cwd: rootDir,
        env: appEnv,
        stdio: "inherit",
        windowsHide: false
      }
    );

    children.set(surface.label, child);

    child.once("error", (error) => {
      if (shuttingDown) {
        return;
      }

      const detail =
        error.code === "ENOENT"
          ? "pnpm could not be found. Install pnpm 9.x and rerun `pnpm dev`."
          : `${surface.label} failed to start: ${error.message}`;

      void shutdown(detail, 1);
    });

    child.once("exit", (code, signal) => {
      children.delete(surface.label);

      if (shuttingDown) {
        return;
      }

      const detail = signal
        ? `${surface.label} exited unexpectedly due to signal ${signal}`
        : `${surface.label} exited unexpectedly with code ${code}`;
      const exitCode = !Number.isInteger(code) || code === 0 ? 1 : code;

      void shutdown(detail, exitCode);
    });
  }

  logInfo("all local app processes started; press Ctrl+C to stop them");

  await new Promise(() => {});
};

main().catch((error) => {
  logError(error.message);
  process.exit(1);
});
