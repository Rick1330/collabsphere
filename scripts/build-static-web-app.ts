import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputArg = process.argv[2];

if (!inputArg) {
  throw new Error("Usage: tsx scripts/build-static-web-app.ts <package-directory>");
}

const packageDir = path.resolve(process.cwd(), inputArg);
const packageJsonPath = path.join(packageDir, "package.json");
const sourceHtmlPath = path.join(packageDir, "src", "index.html");
const distDir = path.join(packageDir, "dist");
const distHtmlPath = path.join(distDir, "index.html");

const fileExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  if (!(await fileExists(packageJsonPath))) {
    throw new Error(`Missing package.json at ${packageJsonPath}.`);
  }

  if (!(await fileExists(sourceHtmlPath))) {
    throw new Error(`Missing static web entrypoint at ${sourceHtmlPath}.`);
  }

  let packageJson: { name: string };

  try {
    packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { name: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to read ${packageJsonPath}: ${message}`);
  }

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(sourceHtmlPath, distHtmlPath);

  console.log(
    `[build] staged ${packageJson.name} static artifact in ${path.relative(repoRoot, distDir)}`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
