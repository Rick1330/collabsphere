import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputArg = process.argv[2];

if (!inputArg) {
  throw new Error("Usage: node scripts/build-bootstrap-app.mjs <package-directory>");
}

const packageDir = path.resolve(process.cwd(), inputArg);
const packageJsonPath = path.join(packageDir, "package.json");
const sourceJsPath = path.join(packageDir, "src", "dev.js");
const sourceTsPath = path.join(packageDir, "src", "dev.ts");
const distDir = path.join(packageDir, "dist");
const distEntryPath = path.join(distDir, "dev.js");
const distPackageJsonPath = path.join(distDir, "package.json");
const sharedApiEnvPath = path.join(repoRoot, "packages", "shared", "src", "api-env.js");
const sharedRuntimeEnvPath = path.join(repoRoot, "packages", "shared", "src", "runtime-env.js");
const sharedEnvCorePath = path.join(repoRoot, "packages", "shared", "src", "env-core.js");
const sharedBootstrapRuntimePath = path.join(repoRoot, "packages", "shared", "src", "bootstrap-runtime.js");
const sharedZodPackagePath = path.join(repoRoot, "packages", "shared", "node_modules", "zod");
const sharedPackageJsonPath = path.join(repoRoot, "packages", "shared", "package.json");
const sharedSourceImport = "../../../packages/shared/src/api-env.js";
const sharedRuntimeSourceImport = "../../../packages/shared/src/runtime-env.js";
const sharedBootstrapRuntimeImport = "../../../packages/shared/src/bootstrap-runtime.js";
const sharedDistImport = "./_shared/api-env.js";
const sharedRuntimeDistImport = "./_shared/runtime-env.js";
const sharedBootstrapRuntimeDistImport = "./_shared/bootstrap-runtime.js";

const fileExists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const sharedPackageJson = JSON.parse(await readFile(sharedPackageJsonPath, "utf8"));
const hasTsSource = await fileExists(sourceTsPath);
const hasJsSource = await fileExists(sourceJsPath);

if (hasTsSource && hasJsSource) {
  throw new Error("Bootstrap entrypoint has both dev.ts and dev.js; remove the JS file.");
}

if (!hasTsSource && !hasJsSource) {
  throw new Error("Missing bootstrap entrypoint (expected src/dev.ts or src/dev.js).");
}

if (hasTsSource && !(await fileExists(distEntryPath))) {
  throw new Error(`Missing compiled bootstrap output at ${distEntryPath}. Run tsc before staging.`);
}

const sourcePath = hasTsSource ? distEntryPath : sourceJsPath;
const sourceCode = await readFile(sourcePath, "utf8");

execFileSync(process.execPath, ["--check", sourcePath], {
  cwd: repoRoot,
  stdio: "pipe",
});

if (hasTsSource) {
  await mkdir(distDir, { recursive: true });
  await rm(path.join(distDir, "_shared"), { recursive: true, force: true });
  await rm(path.join(distDir, "node_modules"), { recursive: true, force: true });
} else {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}
let distSourceCode = sourceCode;
const distPackageDependencies = { ...(packageJson.dependencies ?? {}) };
const needsSharedEnv =
  sourceCode.includes(sharedSourceImport) || sourceCode.includes(sharedRuntimeSourceImport);
const needsSharedBootstrap = sourceCode.includes(sharedBootstrapRuntimeImport);

if (needsSharedEnv || needsSharedBootstrap) {
  const sharedDistDir = path.join(distDir, "_shared");
  const distNodeModulesDir = path.join(distDir, "node_modules");
  await mkdir(sharedDistDir, { recursive: true });

  if (needsSharedBootstrap) {
    await cp(sharedBootstrapRuntimePath, path.join(sharedDistDir, "bootstrap-runtime.js"));
  }

  if (needsSharedEnv) {
    await mkdir(distNodeModulesDir, { recursive: true });
    await cp(sharedApiEnvPath, path.join(sharedDistDir, "api-env.js"));
    await cp(sharedRuntimeEnvPath, path.join(sharedDistDir, "runtime-env.js"));
    await cp(sharedEnvCorePath, path.join(sharedDistDir, "env-core.js"));
    await cp(sharedZodPackagePath, path.join(distNodeModulesDir, "zod"), {
      recursive: true,
    });
  }

  distSourceCode = sourceCode
    .split(sharedSourceImport)
    .join(sharedDistImport)
    .split(sharedRuntimeSourceImport)
    .join(sharedRuntimeDistImport)
    .split(sharedBootstrapRuntimeImport)
    .join(sharedBootstrapRuntimeDistImport);

  if (needsSharedEnv && sharedPackageJson.dependencies?.zod) {
    distPackageDependencies.zod = sharedPackageJson.dependencies.zod;
  }
}

if (
  distSourceCode.includes(sharedSourceImport) ||
  distSourceCode.includes(sharedRuntimeSourceImport) ||
  distSourceCode.includes(sharedBootstrapRuntimeImport)
) {
  throw new Error("Bootstrap artifact still references a monorepo shared source path.");
}

await writeFile(distEntryPath, distSourceCode, "utf8");
await writeFile(
  distPackageJsonPath,
  JSON.stringify(
    {
      name: packageJson.name,
      private: true,
      type: packageJson.type ?? "module",
      main: "./dev.js",
      dependencies:
        Object.keys(distPackageDependencies).length > 0 ? distPackageDependencies : undefined,
      scripts: {
        start: "node dev.js",
      },
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`[build] staged ${packageJson.name} bootstrap artifact in ${path.relative(repoRoot, distDir)}`);
