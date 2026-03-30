import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

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

export const stopChild = async (child) => {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGTERM");
  }

  await waitForChildExit(child);
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
  const [code, signal] = await waitForChildExit(child);

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
  });

export const getJson = (port, pathName = "/") =>
  new Promise((resolve, reject) => {
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
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(body),
          });
        });
      },
    );

    request.once("error", reject);
  });

export const spawnBootstrap = ({ entryPath, cwd, envOverrides }) =>
  spawn(process.execPath, [entryPath], {
    cwd,
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
