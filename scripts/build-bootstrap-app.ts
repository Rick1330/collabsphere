import { cp, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputArg = process.argv[2];

if (!inputArg) {
  throw new Error("Usage: tsx scripts/build-bootstrap-app.ts <package-directory>");
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
const sharedZodPackagePath = path.join(repoRoot, "packages", "shared", "node_modules", "zod");
const sharedPackageJsonPath = path.join(repoRoot, "packages", "shared", "package.json");
const typescriptCliPath = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const sharedSourceImport = "../../../packages/shared/src/api-env.js";
const sharedRuntimeSourceImport = "../../../packages/shared/src/runtime-env.js";
const sharedBootstrapRuntimeImport = "../../../packages/shared/src/bootstrap-runtime.js";
const sharedDistImport = "./_shared/api-env.js";
const sharedRuntimeDistImport = "./_shared/runtime-env.js";
const sharedBootstrapRuntimeDistImport = "./_shared/bootstrap-runtime.js";

type PackageJson = {
  name: string;
  type?: string;
  dependencies?: Record<string, string>;
};

type SharedPackageJson = {
  dependencies?: Record<string, string>;
};

type BuildContext = {
  packageJson: PackageJson;
  sharedPackageJson: SharedPackageJson;
  hasTsSource: boolean;
  hasJsSource: boolean;
  compiledAppSourceDir: string;
  detectionPath: string;
  compiledPath: string;
  sourceCode: string;
  compiledSourceCode: string;
};

const compileOutputDirs = [path.join(distDir, "apps"), path.join(distDir, "packages")];

const removeDirectoryWithRetries = async ({
  directory,
  maxAttempts = 8,
}: {
  directory: string;
  maxAttempts?: number;
}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Windows can transiently fail removing deeply nested folders (ENOTEMPTY/EPERM)
      // due to filesystem latency or background indexers. Backoff and retry.
      const delayMs = 100 * (attempt + 1) * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const fileExists = async ({ filePath }: { filePath: string }) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const compileSharedRuntimeModules = ({
  outDir,
  entryPoints,
}: {
  outDir: string;
  entryPoints: string[];
}) => {
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

const runSyntaxCheck = ({ filePath }: { filePath: string }) => {
  try {
    execFileSync(process.execPath, ["--check", filePath], {
      cwd: repoRoot,
      stdio: "pipe",
    });
  } catch (error) {
    const execError = error as { stderr?: unknown; stdout?: unknown };
    const stderr = Buffer.isBuffer(execError.stderr) ? execError.stderr.toString("utf8").trim() : "";
    const stdout = Buffer.isBuffer(execError.stdout) ? execError.stdout.toString("utf8").trim() : "";
    const details = [stderr, stdout].filter(Boolean).join("\n");
    throw new Error(
      details
        ? `Syntax check failed for ${filePath}:\n${details}`
        : `Syntax check failed for ${filePath}.`,
    );
  }
};

const loadBuildContext = async (): Promise<BuildContext> => {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;
  const sharedPackageJson = JSON.parse(await readFile(sharedPackageJsonPath, "utf8")) as SharedPackageJson;
  const hasTsSource = await fileExists({ filePath: sourceTsPath });
  const hasJsSource = await fileExists({ filePath: sourceJsPath });
  const compiledAppSourceDir = path.dirname(compiledTsEntryPath);
  const detectionPath = hasTsSource ? sourceTsPath : sourceJsPath;
  const compiledPath = hasTsSource ? compiledTsEntryPath : sourceJsPath;
  const sourceCode = await readFile(detectionPath, "utf8");
  const compiledSourceCode = await readFile(compiledPath, "utf8");

  return {
    packageJson,
    sharedPackageJson,
    hasTsSource,
    hasJsSource,
    compiledAppSourceDir,
    detectionPath,
    compiledPath,
    sourceCode,
    compiledSourceCode,
  };
};

const assertSingleBootstrapEntrypoint = (context: BuildContext) => {
  if (context.hasTsSource && context.hasJsSource) {
    throw new Error("Bootstrap entrypoint has both dev.ts and dev.js; remove the JS file.");
  }
};

const assertBootstrapEntrypointExists = (context: BuildContext) => {
  if (!(context.hasTsSource || context.hasJsSource)) {
    throw new Error("Missing bootstrap entrypoint (expected src/dev.ts or src/dev.js).");
  }
};

const ensureCompiledTsBootstrapExists = async ({ hasTsSource }: { hasTsSource: boolean }) => {
  if (!hasTsSource) {
    return;
  }

  if (await fileExists({ filePath: compiledTsEntryPath })) {
    return;
  }

  throw new Error(
    `Missing compiled bootstrap output at ${compiledTsEntryPath}. Run tsc before staging.`,
  );
};

const validateBuildContext = async (context: BuildContext) => {
  assertSingleBootstrapEntrypoint(context);
  assertBootstrapEntrypointExists(context);
  await ensureCompiledTsBootstrapExists({ hasTsSource: context.hasTsSource });
};

const stageAppDistLayout = async (context: BuildContext) => {
  if (!context.hasTsSource) {
    await removeDirectoryWithRetries({ directory: distDir });
    await mkdir(distDir, { recursive: true });
    return;
  }

  await mkdir(distDir, { recursive: true });
  await removeDirectoryWithRetries({ directory: path.join(distDir, "_shared") });
  await removeDirectoryWithRetries({ directory: path.join(distDir, "node_modules") });
  await rm(distEntryPath, { force: true });
  await rm(distPackageJsonPath, { force: true });

  for (const entry of await readdir(context.compiledAppSourceDir, { withFileTypes: true })) {
    if (entry.name === "dev.js") {
      continue;
    }

    const sourcePath = path.join(context.compiledAppSourceDir, entry.name);
    const targetPath = path.join(distDir, entry.name);
    await rm(targetPath, { recursive: true, force: true });
    await cp(sourcePath, targetPath, { recursive: entry.isDirectory() });
  }
};

const needsSharedEnvRuntime = ({ sourceCode }: { sourceCode: string }) =>
  sourceCode.includes(sharedSourceImport) || sourceCode.includes(sharedRuntimeSourceImport);

const needsSharedBootstrapRuntime = ({ sourceCode }: { sourceCode: string }) =>
  sourceCode.includes(sharedBootstrapRuntimeImport);

const collectSharedRuntimeEntryPoints = ({
  needsSharedEnv,
  needsSharedBootstrap,
}: {
  needsSharedEnv: boolean;
  needsSharedBootstrap: boolean;
}) => {
  const entryPoints = [];
  if (needsSharedBootstrap) {
    entryPoints.push(sharedBootstrapRuntimePath);
  }
  if (needsSharedEnv) {
    entryPoints.push(sharedApiEnvPath, sharedRuntimeEnvPath, sharedEnvCorePath);
  }
  return entryPoints;
};

const stageSharedRuntimeArtifacts = async ({
  needsSharedEnv,
  sharedDistDir,
  distNodeModulesDir,
  sharedRuntimeEntryPoints,
}: {
  needsSharedEnv: boolean;
  sharedDistDir: string;
  distNodeModulesDir: string;
  sharedRuntimeEntryPoints: string[];
}) => {
  if (sharedRuntimeEntryPoints.length > 0) {
    compileSharedRuntimeModules({ outDir: sharedDistDir, entryPoints: sharedRuntimeEntryPoints });
  }

  if (!needsSharedEnv) {
    return;
  }

  await mkdir(distNodeModulesDir, { recursive: true });
  await cp(await realpath(sharedZodPackagePath), path.join(distNodeModulesDir, "zod"), {
    recursive: true,
    dereference: true,
  });
};

const rewriteSharedRuntimeImports = ({ sourceCode }: { sourceCode: string }) =>
  sourceCode
    .split(sharedSourceImport)
    .join(sharedDistImport)
    .split(sharedRuntimeSourceImport)
    .join(sharedRuntimeDistImport)
    .split(sharedBootstrapRuntimeImport)
    .join(sharedBootstrapRuntimeDistImport);

const assertNoMonorepoSharedImports = ({ sourceCode }: { sourceCode: string }) => {
  const monorepoImports = [
    sharedSourceImport,
    sharedRuntimeSourceImport,
    sharedBootstrapRuntimeImport,
  ];

  if (monorepoImports.some((moduleImport) => sourceCode.includes(moduleImport))) {
    throw new Error("Bootstrap artifact still references a monorepo shared source path.");
  }
};

const writeStagedArtifact = async ({
  packageJson,
  distSourceCode,
  distPackageDependencies,
}: {
  packageJson: PackageJson;
  distSourceCode: string;
  distPackageDependencies: Record<string, string>;
}) => {
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
};

const cleanupTsCompileArtifacts = async ({ hasTsSource }: { hasTsSource: boolean }) => {
  if (!hasTsSource) {
    return;
  }

  for (const directory of compileOutputDirs) {
    await removeDirectoryWithRetries({ directory });
  }
};

const main = async () => {
  const context = await loadBuildContext();
  await validateBuildContext(context);
  runSyntaxCheck({ filePath: context.compiledPath });
  await stageAppDistLayout(context);

  let distSourceCode = context.compiledSourceCode;
  const distPackageDependencies = context.packageJson.dependencies
    ? { ...context.packageJson.dependencies }
    : {};
  const needsSharedEnv = needsSharedEnvRuntime({ sourceCode: context.sourceCode });
  const needsSharedBootstrap = needsSharedBootstrapRuntime({ sourceCode: context.sourceCode });
  const sharedRuntimeEntryPoints = collectSharedRuntimeEntryPoints({
    needsSharedEnv,
    needsSharedBootstrap,
  });

  if (needsSharedEnv || needsSharedBootstrap) {
    const sharedDistDir = path.join(distDir, "_shared");
    const distNodeModulesDir = path.join(distDir, "node_modules");
    await mkdir(sharedDistDir, { recursive: true });

    await stageSharedRuntimeArtifacts({
      needsSharedEnv,
      sharedDistDir,
      distNodeModulesDir,
      sharedRuntimeEntryPoints,
    });

    distSourceCode = rewriteSharedRuntimeImports({ sourceCode: distSourceCode });

    if (needsSharedEnv && context.sharedPackageJson.dependencies?.zod) {
      distPackageDependencies.zod = context.sharedPackageJson.dependencies.zod;
    }
  }

  assertNoMonorepoSharedImports({ sourceCode: distSourceCode });
  await writeStagedArtifact({
    packageJson: context.packageJson,
    distSourceCode,
    distPackageDependencies,
  });
  await cleanupTsCompileArtifacts({ hasTsSource: context.hasTsSource });

  console.log(
    `[build] staged ${context.packageJson.name} bootstrap artifact in ${path.relative(repoRoot, distDir)}`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
