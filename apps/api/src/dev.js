import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const host = process.env.HOST ?? "127.0.0.1";
const defaultPort = 3001;

const parsePort = (value, fallback, service) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (!/^\d+$/.test(trimmed)) {
    console.warn(`[${service}] invalid PORT value "${value}", falling back to ${fallback}`);
    return fallback;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    console.warn(`[${service}] invalid PORT value "${value}", falling back to ${fallback}`);
    return fallback;
  }

  return parsed;
};

const port = parsePort(process.env.PORT, defaultPort, "api");

const writeJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
};

const createRequestId = () => `req_${randomUUID()}`;

const server = createServer((request, response) => {
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

const listen = (candidatePort) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[api] bootstrap listening on http://${host}:${activePort}/api/v1/health`);
  };

  server
    .once("error", (error) => {
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

const shutdown = (signal) => {
  console.log(`[api] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
