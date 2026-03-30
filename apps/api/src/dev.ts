import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { EnvValidationError, parseApiRuntimeEnv } from "../../../packages/shared/src/api-env.js";

const host = process.env.HOST ?? "127.0.0.1";
const defaultPort = 3001;

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
    return parseApiRuntimeEnv(process.env);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(`[api] ${error.message}`);
      process.exit(1);
    }

    throw error;
  }
};

validateRuntimeEnv();

const port = parsePort(process.env.PORT, defaultPort, "api");

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown) => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
};

const createRequestId = () => `req_${randomUUID()}`;

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestId = createRequestId();
  let url;

  try {
    url = new URL(request.url ?? "/", "http://bootstrap");
  } catch {
    return writeJson(response, 400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request URL",
        requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/health") {
    return writeJson(response, 200, {
      data: {
        resource: {
          service: "api",
          status: "ok",
          mode: "bootstrap"
        }
      },
      meta: {
        requestId
      }
    });
  }

  return writeJson(response, 404, {
    error: {
      code: "NOT_FOUND",
      message: `No bootstrap route for ${request.method} ${url.pathname}`,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
});

const listen = (candidatePort: number) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[api] bootstrap listening on http://${host}:${activePort}/api/v1/health`);
  };

  server
    .once("error", (error: NodeJS.ErrnoException) => {
      server.removeListener("listening", onListening);

      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[api] port ${candidatePort} in use, retrying on an ephemeral port`);
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
  console.log(`[api] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
