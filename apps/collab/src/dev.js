import { createServer } from "node:http";

const host = process.env.HOST ?? "127.0.0.1";
const defaultPort = 3002;

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

const port = parsePort(process.env.PORT, defaultPort, "collab");

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    service: "collab",
    status: "ok",
    mode: "bootstrap",
    detail: "Minimal placeholder for future Hocuspocus startup."
  }, null, 2));
});

const listen = (candidatePort) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[collab] bootstrap listening on http://${host}:${activePort}`);
  };

  server
    .once("error", (error) => {
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

const shutdown = (signal) => {
  console.log(`[collab] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
