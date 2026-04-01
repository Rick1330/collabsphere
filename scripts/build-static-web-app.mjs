import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputArg = process.argv[2];

if (!inputArg) {
  throw new Error("Usage: node scripts/build-static-web-app.mjs <package-directory>");
}

const packageDir = path.resolve(process.cwd(), inputArg);
const packageJsonPath = path.join(packageDir, "package.json");
const sourceHtmlPath = path.join(packageDir, "src", "index.html");
const distDir = path.join(packageDir, "dist");
const distHtmlPath = path.join(distDir, "index.html");

const fileExists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

if (!(await fileExists(sourceHtmlPath))) {
  throw new Error(`Missing static web entrypoint at ${sourceHtmlPath}.`);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(sourceHtmlPath, distHtmlPath);

console.log(
  `[build] staged ${packageJson.name} static artifact in ${path.relative(repoRoot, distDir)}`,
);
