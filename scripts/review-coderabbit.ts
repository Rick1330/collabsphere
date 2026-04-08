import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const defaultCliArgs = ["--plain"];

const run = (command: string, args: string[]) =>
  spawnSync(command, args, { stdio: "inherit" });

const runQuiet = (command: string, args: string[]) =>
  spawnSync(command, args, { stdio: "pipe", encoding: "utf8" });

const toWslPath = (windowsPath: string) => {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(windowsPath);
  if (!match) {
    return windowsPath.replace(/\\/g, "/");
  }

  const drive = match[1].toLowerCase();
  const rest = match[2].replace(/[\\/]/g, "/");
  return `/mnt/${drive}/${rest}`;
};

const escapeSingleQuotedShellArg = (value: string) => value.replace(/'/g, "'\"'\"'");
const asPosixPath = (value: string) => value.replace(/[\\/]/g, "/");

const resolveWslGitEnv = (windowsCwd: string, wslCwd: string) => {
  const dotGitPath = join(windowsCwd, ".git");
  if (!existsSync(dotGitPath)) {
    return null;
  }

  const dotGitStats = statSync(dotGitPath);
  if (!dotGitStats.isFile()) {
    return null;
  }

  const dotGitContent = readFileSync(dotGitPath, "utf8").trim();
  if (!dotGitContent.startsWith("gitdir:")) {
    return null;
  }

  const gitDirRaw = dotGitContent.slice("gitdir:".length).trim();
  let gitDir = toWslPath(gitDirRaw);

  if (!gitDir.startsWith("/")) {
    const joined = `${wslCwd}/${asPosixPath(gitDirRaw)}`;
    gitDir = joined.replace(/\/+/g, "/");
  }

  const worktreesSegment = "/worktrees/";
  const worktreesIndex = gitDir.indexOf(worktreesSegment);
  const gitCommonDir = worktreesIndex > 0 ? gitDir.slice(0, worktreesIndex) : null;

  return {
    gitDir,
    gitCommonDir,
    gitWorkTree: wslCwd,
  };
};

const cliArgs = process.argv.slice(2);
const args = cliArgs.length > 0 ? cliArgs : defaultCliArgs;

const nativeCli = runQuiet("coderabbit", ["--version"]);
if (nativeCli.status === 0) {
  const result = run("coderabbit", args);
  process.exit(result.status ?? 1);
}

if (process.platform !== "win32") {
  process.stderr.write(
    "CodeRabbit CLI is not installed in PATH. Install it with: curl -fsSL https://cli.coderabbit.ai/install.sh | sh\n",
  );
  process.exit(1);
}

const wslStatus = runQuiet("wsl", ["--status"]);
if (wslStatus.status !== 0) {
  process.stderr.write(
    "WSL is not available. Install CodeRabbit CLI natively or enable WSL.\n",
  );
  process.exit(1);
}

const wslCli = runQuiet("wsl", [
  "bash",
  "-lc",
  "command -v coderabbit >/dev/null 2>&1",
]);
if (wslCli.status !== 0) {
  process.stderr.write(
    "CodeRabbit CLI is not installed in WSL. Install it in WSL with: curl -fsSL https://cli.coderabbit.ai/install.sh | sh\n",
  );
  process.exit(1);
}

const wslCwd = toWslPath(process.cwd());
const wslGitEnv = resolveWslGitEnv(process.cwd(), wslCwd);
const shellArgs = args.map((arg) => `'${escapeSingleQuotedShellArg(arg)}'`).join(" ");
const envExports = [
  wslGitEnv ? `export GIT_DIR='${escapeSingleQuotedShellArg(wslGitEnv.gitDir)}'` : null,
  wslGitEnv?.gitCommonDir
    ? `export GIT_COMMON_DIR='${escapeSingleQuotedShellArg(wslGitEnv.gitCommonDir)}'`
    : null,
  wslGitEnv
    ? `export GIT_WORK_TREE='${escapeSingleQuotedShellArg(wslGitEnv.gitWorkTree)}'`
    : null,
]
  .filter(Boolean)
  .join(" && ");
const shellCommand =
  `${envExports ? `${envExports} && ` : ""}cd '${escapeSingleQuotedShellArg(wslCwd)}' && coderabbit ${shellArgs}`;
const result = run("wsl", ["bash", "-lc", shellCommand]);
process.exit(result.status ?? 1);
