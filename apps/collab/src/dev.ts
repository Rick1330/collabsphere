import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { EnvValidationError, parseRuntimeEnv } from "../../../packages/shared/src/runtime-env.js";

const host = process.env.HOST ?? "127.0.0.1";
const defaultPort = 3002;

const warnInvalidPort = (service: string, value: string | undefined, fallback: number) => {
  console.warn(`[${service}] invalid PORT value "${value}", falling back to ${fallback}`);
  return fallback;
};

const parsePort = (value: string | undefined, fallback: number, service: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (!/^\d+$/.test(trimmed)) {
    return warnInvalidPort(service, value, fallback);
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isInteger(parsed)) {
    return warnInvalidPort(service, value, fallback);
  }

  if (parsed < 0) {
    return warnInvalidPort(service, value, fallback);
  }

  if (parsed > 65535) {
    return warnInvalidPort(service, value, fallback);
  }

  return parsed;
};

const validateRuntimeEnv = () => {
  try {
    return parseRuntimeEnv(process.env);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(`[collab] ${error.message}`);
      process.exit(1);
    }

    throw error;
  }
};

validateRuntimeEnv();

const port = parsePort(process.env.PORT, defaultPort, "collab");

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    service: "collab",
    status: "ok",
    mode: "bootstrap",
    detail: "Minimal placeholder for future Hocuspocus startup."
  }, null, 2));
});

const listen = (candidatePort: number) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[collab] bootstrap listening on http://${host}:${activePort}`);
  };

  server
    .once("error", (error: NodeJS.ErrnoException) => {
      server.removeListener("listening", onListening);

      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[collab] port ${candidatePort} in use, retrying on an ephemeral port`);
        listen(0);
        return;
      }

      throw error;
    })
    .once("listening", onListening)
    .listen(candidatePort, host);
};

listen(port);

let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`[collab] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
