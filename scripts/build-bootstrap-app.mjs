import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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
const compiledTsEntryPath = path.join(
  distDir,
  path.relative(repoRoot, sourceTsPath).replace(/\.ts$/, ".js"),
);
const sharedApiEnvPath = path.join(repoRoot, "packages", "shared", "src", "api-env.ts");
const sharedRuntimeEnvPath = path.join(repoRoot, "packages", "shared", "src", "runtime-env.ts");
const sharedEnvCorePath = path.join(repoRoot, "packages", "shared", "src", "env-core.ts");
const sharedBootstrapRuntimePath = path.join(repoRoot, "packages", "shared", "src", "bootstrap-runtime.ts");
const compiledSharedApiEnvPath = path.join(distDir, "packages", "shared", "src", "api-env.js");
const compiledSharedRuntimeEnvPath = path.join(distDir, "packages", "shared", "src", "runtime-env.js");
const compiledSharedEnvCorePath = path.join(distDir, "packages", "shared", "src", "env-core.js");
const compiledSharedBootstrapRuntimePath = path.join(
  distDir,
  "packages",
  "shared",
  "src",
  "bootstrap-runtime.js",
);
const sharedZodPackagePath = path.join(repoRoot, "packages", "shared", "node_modules", "zod");
const sharedPackageJsonPath = path.join(repoRoot, "packages", "shared", "package.json");
const typescriptCliPath = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
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

const compileSharedRuntimeModules = (outDir, entryPoints) => {
  execFileSync(
    process.execPath,
    [
      typescriptCliPath,
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--strict",
      "--skipLibCheck",
      "--esModuleInterop",
      "--allowSyntheticDefaultImports",
      "--verbatimModuleSyntax",
      "--outDir",
      outDir,
      ...entryPoints,
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );
};

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const sharedPackageJson = JSON.parse(await readFile(sharedPackageJsonPath, "utf8"));
const hasTsSource = await fileExists(sourceTsPath);
const hasJsSource = await fileExists(sourceJsPath);
const compiledAppSourceDir = path.dirname(compiledTsEntryPath);

if (hasTsSource && hasJsSource) {
  throw new Error("Bootstrap entrypoint has both dev.ts and dev.js; remove the JS file.");
}

if (!hasTsSource && !hasJsSource) {
  throw new Error("Missing bootstrap entrypoint (expected src/dev.ts or src/dev.js).");
}

if (hasTsSource && !(await fileExists(compiledTsEntryPath))) {
  throw new Error(
    `Missing compiled bootstrap output at ${compiledTsEntryPath}. Run tsc before staging.`,
  );
}

const detectionPath = hasTsSource ? sourceTsPath : sourceJsPath;
const compiledPath = hasTsSource ? compiledTsEntryPath : sourceJsPath;
const sourceCode = await readFile(detectionPath, "utf8");
const compiledSourceCode = await readFile(compiledPath, "utf8");

execFileSync(process.execPath, ["--check", compiledPath], {
  cwd: repoRoot,
  stdio: "pipe",
});

if (hasTsSource) {
  await mkdir(distDir, { recursive: true });
  await rm(path.join(distDir, "_shared"), { recursive: true, force: true });
  await rm(path.join(distDir, "node_modules"), { recursive: true, force: true });
  await rm(distEntryPath, { force: true });
  await rm(distPackageJsonPath, { force: true });

  for (const entry of await readdir(compiledAppSourceDir, { withFileTypes: true })) {
    if (entry.name === "dev.js") {
      continue;
    }

    const sourcePath = path.join(compiledAppSourceDir, entry.name);
    const targetPath = path.join(distDir, entry.name);
    await rm(targetPath, { recursive: true, force: true });
    await cp(sourcePath, targetPath, { recursive: entry.isDirectory() });
  }
} else {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}
let distSourceCode = compiledSourceCode;
const distPackageDependencies = { ...(packageJson.dependencies ?? {}) };
const needsSharedEnv =
  sourceCode.includes(sharedSourceImport) || sourceCode.includes(sharedRuntimeSourceImport);
const needsSharedBootstrap = sourceCode.includes(sharedBootstrapRuntimeImport);

if (needsSharedEnv || needsSharedBootstrap) {
  const sharedDistDir = path.join(distDir, "_shared");
  const distNodeModulesDir = path.join(distDir, "node_modules");
  await mkdir(sharedDistDir, { recursive: true });

  const sharedRuntimeEntryPoints = [
    ...(needsSharedBootstrap ? [sharedBootstrapRuntimePath] : []),
    ...(needsSharedEnv ? [sharedApiEnvPath, sharedRuntimeEnvPath, sharedEnvCorePath] : []),
  ];

  const canReuseCompiledSharedFiles =
    (!needsSharedBootstrap || (await fileExists(compiledSharedBootstrapRuntimePath))) &&
    (!needsSharedEnv ||
      ((await fileExists(compiledSharedApiEnvPath)) &&
        (await fileExists(compiledSharedRuntimeEnvPath)) &&
        (await fileExists(compiledSharedEnvCorePath))));

  if (sharedRuntimeEntryPoints.length > 0 && !canReuseCompiledSharedFiles) {
    compileSharedRuntimeModules(sharedDistDir, sharedRuntimeEntryPoints);
  }

  if (needsSharedBootstrap && canReuseCompiledSharedFiles) {
    await cp(compiledSharedBootstrapRuntimePath, path.join(sharedDistDir, "bootstrap-runtime.js"));
  }

  if (needsSharedEnv) {
    await mkdir(distNodeModulesDir, { recursive: true });
    if (canReuseCompiledSharedFiles) {
      await cp(compiledSharedApiEnvPath, path.join(sharedDistDir, "api-env.js"));
      await cp(compiledSharedRuntimeEnvPath, path.join(sharedDistDir, "runtime-env.js"));
      await cp(compiledSharedEnvCorePath, path.join(sharedDistDir, "env-core.js"));
    }
    await cp(sharedZodPackagePath, path.join(distNodeModulesDir, "zod"), {
      recursive: true,
    });
  }

  distSourceCode = distSourceCode
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

if (hasTsSource) {
  await rm(path.join(distDir, "apps"), { recursive: true, force: true });
  await rm(path.join(distDir, "packages"), { recursive: true, force: true });
}

console.log(`[build] staged ${packageJson.name} bootstrap artifact in ${path.relative(repoRoot, distDir)}`);
