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

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

execFileSync(process.execPath, ["--check", sourcePath], {
  cwd: repoRoot,
  stdio: "pipe",
});

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(sourcePath, distEntryPath);
await writeFile(
  distPackageJsonPath,
  JSON.stringify(
    {
      name: packageJson.name,
      private: true,
      type: packageJson.type ?? "module",
      main: "./dev.js",
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
