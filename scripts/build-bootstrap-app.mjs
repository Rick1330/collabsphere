import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
const sourcePath = path.join(packageDir, "src", "dev.js");
const distDir = path.join(packageDir, "dist");
const distEntryPath = path.join(distDir, "dev.js");
const distPackageJsonPath = path.join(distDir, "package.json");
const sharedApiEnvPath = path.join(repoRoot, "packages", "shared", "src", "api-env.js");
const sharedEnvCorePath = path.join(repoRoot, "packages", "shared", "src", "env-core.js");
const sharedZodPackagePath = path.join(repoRoot, "packages", "shared", "node_modules", "zod");
const sharedPackageJsonPath = path.join(repoRoot, "packages", "shared", "package.json");
const sharedSourceImport = "../../../packages/shared/src/api-env.js";
const sharedDistImport = "./_shared/api-env.js";

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const sharedPackageJson = JSON.parse(await readFile(sharedPackageJsonPath, "utf8"));
const sourceCode = await readFile(sourcePath, "utf8");

execFileSync(process.execPath, ["--check", sourcePath], {
  cwd: repoRoot,
  stdio: "pipe",
});

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
let distSourceCode = sourceCode;
const distPackageDependencies = { ...(packageJson.dependencies ?? {}) };

if (sourceCode.includes(sharedSourceImport)) {
  const sharedDistDir = path.join(distDir, "_shared");
  const distNodeModulesDir = path.join(distDir, "node_modules");
  await mkdir(sharedDistDir, { recursive: true });
  await mkdir(distNodeModulesDir, { recursive: true });
  await cp(sharedApiEnvPath, path.join(sharedDistDir, "api-env.js"));
  await cp(sharedEnvCorePath, path.join(sharedDistDir, "env-core.js"));
  await cp(sharedZodPackagePath, path.join(distNodeModulesDir, "zod"), {
    recursive: true,
  });
  distSourceCode = sourceCode.split(sharedSourceImport).join(sharedDistImport);
  if (sharedPackageJson.dependencies?.zod) {
    distPackageDependencies.zod = sharedPackageJson.dependencies.zod;
  }
}

if (distSourceCode.includes(sharedSourceImport)) {
  throw new Error(`Bootstrap artifact still references monorepo source path ${sharedSourceImport}.`);
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
