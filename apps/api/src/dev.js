import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3001", 10);

const writeJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
};

const createRequestId = () => `req_${randomUUID()}`;

const server = createServer((request, response) => {
  const requestId = createRequestId();
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

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
  server
    .once("error", (error) => {
      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[api] port ${candidatePort} in use, retrying on an ephemeral port`);
        listen(0);
        return;
      }

      throw error;
    })
    .listen(candidatePort, host, () => {
      const address = server.address();
      const activePort = typeof address === "object" && address ? address.port : candidatePort;
      console.log(`[api] bootstrap listening on http://${host}:${activePort}/api/v1/health`);
    });
};

listen(port);

const shutdown = (signal) => {
  console.log(`[api] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
