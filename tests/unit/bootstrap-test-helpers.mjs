import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const tscCli = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

export const collectStream = (stream) => {
  let value = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    value += chunk;
  });
  return () => value;
};

export const waitForChildExit = (child) => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve([child.exitCode, child.signalCode]);
  }

  return once(child, "exit");
};

const childExitTimeoutMs = 5000;
const requestTimeoutMs = 5000;

const waitForChildExitWithTimeout = (child, timeoutMs, label) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for child to exit after ${label}.`));
    }, timeoutMs);

    waitForChildExit(child).then(
      (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

export const stopChild = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  try {
    await waitForChildExitWithTimeout(child, childExitTimeoutMs, "SIGTERM");
  } catch {
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }

    child.kill("SIGKILL");
    await waitForChildExitWithTimeout(child, childExitTimeoutMs, "SIGKILL");
  }
};

export const assertBootstrapValidationFailure = async ({
  spawnFn,
  envOverrides,
  service,
  expectedMessages,
  forbiddenPatterns = [],
}) => {
  const child = spawnFn(envOverrides);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);
  let code;
  let signal;

  try {
    [code, signal] = await waitForChildExitWithTimeout(
      child,
      childExitTimeoutMs,
      `[${service}] bootstrap`,
    );
  } catch (error) {
    try {
      await stopChild(child);
    } catch {
      // Cleanup best-effort; keep original timeout error context.
    }
    throw error;
  }

  assert.equal(code, 1);
  assert.equal(signal, null);
  assert.equal(stdoutText(), "");
  assert.match(stderrText(), new RegExp(`\\[${service}\\] Environment validation failed`));

  for (const message of expectedMessages) {
    assert.match(stderrText(), message);
  }

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(stderrText(), pattern);
  }
};

export const waitForStdoutMatch = (child, stdoutText, pattern, description) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${description}.\nstdout:\n${stdoutText()}`));
    }, 5000);

    const onData = () => {
      const match = stdoutText().match(pattern);
      if (!match) {
        return;
      }

      cleanup();
      clearTimeout(timeout);
      resolve(match);
    };

    const onExit = (code, signal) => {
      cleanup();
      clearTimeout(timeout);
      reject(
        new Error(
          `Process exited before ${description} (code=${code}, signal=${signal}).\nstdout:\n${stdoutText()}`,
        ),
      );
    };

    const cleanup = () => {
      child.stdout.off("data", onData);
      child.off("exit", onExit);
    };

    child.stdout.on("data", onData);
    child.on("exit", onExit);
    onData();
  });

export const getJson = (port, pathName = "/") =>
  new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback) => (value) => {
      if (settled) {
        return;
      }

      settled = true;
      callback(value);
    };
    const resolveOnce = settle(resolve);
    const rejectOnce = settle(reject);
    const request = http.get(
      {
        host: "127.0.0.1",
        port,
        path: pathName,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.once("error", rejectOnce);
        response.on("end", () => {
          try {
            resolveOnce({
              statusCode: response.statusCode,
              body: JSON.parse(body),
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            rejectOnce(
              new Error(
                `Failed to parse JSON from ${pathName} (port ${port}, status ${response.statusCode}): ${message}\nbody:\n${body}`,
              ),
            );
          }
        });
      },
    );

    request.once("error", rejectOnce);
    request.setTimeout(requestTimeoutMs, () => {
      request.destroy(new Error(`Timed out fetching http://127.0.0.1:${port}${pathName}`));
    });
  });

export const spawnBootstrap = ({ entryPath, cwd, envOverrides }) => {
  const useTsx = entryPath.endsWith(".ts");
  const command = process.execPath;
  const args = useTsx ? [tsxCli, entryPath] : [entryPath];

  return spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
};

export const runTsc = (projectPath) => {
  execFileSync(process.execPath, [tscCli, "-p", projectPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};
