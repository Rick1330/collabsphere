import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { Readable } from "node:stream";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const tscCli = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

export const collectStream = (stream: Readable) => {
  let value = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    value += chunk;
  });
  return () => value;
};

export const waitForChildExit = (child: ChildProcessWithoutNullStreams) => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve<[number | null, NodeJS.Signals | null]>([
      child.exitCode,
      child.signalCode,
    ]);
  }

  return once(child, "exit") as Promise<[number | null, NodeJS.Signals | null]>;
};

const childExitTimeoutMs = 5000;
const requestTimeoutMs = 5000;

const waitForChildExitWithTimeout = (
  child: ChildProcessWithoutNullStreams,
  timeoutMs: number,
  label: string,
) =>
  new Promise<[number | null, NodeJS.Signals | null]>((resolve, reject) => {
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

export const stopChild = async (child: ChildProcessWithoutNullStreams) => {
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

type ValidationFailureOptions = {
  spawnFn: (envOverrides: NodeJS.ProcessEnv) => ChildProcessWithoutNullStreams;
  envOverrides: NodeJS.ProcessEnv;
  service: string;
  expectedMessages: RegExp[];
  forbiddenPatterns?: RegExp[];
};

export const assertBootstrapValidationFailure = async ({
  spawnFn,
  envOverrides,
  service,
  expectedMessages,
  forbiddenPatterns = [],
}: ValidationFailureOptions) => {
  const child = spawnFn(envOverrides);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);
  let code: number | null;
  let signal: NodeJS.Signals | null;

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

export const waitForStdoutMatch = (
  child: ChildProcessWithoutNullStreams,
  stdoutText: () => string,
  pattern: RegExp,
  description: string,
) =>
  new Promise<RegExpMatchArray>((resolve, reject) => {
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

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
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

type JsonResponse = {
  statusCode: number | undefined;
  headers: http.IncomingHttpHeaders;
  body: unknown;
};

export const getJson = (port: number, pathName = "/") =>
  new Promise<JsonResponse>((resolve, reject) => {
    let settled = false;
    const settle = <T>(callback: (value: T) => void) => (value: T) => {
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
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.once("error", rejectOnce);
        response.on("end", () => {
          try {
            resolveOnce({
              statusCode: response.statusCode,
              headers: response.headers,
              body: JSON.parse(body) as unknown,
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

type SpawnBootstrapOptions = {
  entryPath: string;
  cwd: string;
  envOverrides?: NodeJS.ProcessEnv;
};

export const spawnBootstrap = ({ entryPath, cwd, envOverrides }: SpawnBootstrapOptions) => {
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

export const runTsc = (projectPath: string) => {
  execFileSync(process.execPath, [tscCli, "-p", projectPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

export const runTsx = (...args: string[]) => {
  execFileSync(process.execPath, [tsxCli, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};
