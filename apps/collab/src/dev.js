import { createServer } from "node:http";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3002", 10);

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
  server
    .once("error", (error) => {
      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[collab] port ${candidatePort} in use, retrying on an ephemeral port`);
        listen(0);
        return;
      }

      throw error;
    })
    .listen(candidatePort, host, () => {
      const address = server.address();
      const activePort = typeof address === "object" && address ? address.port : candidatePort;
      console.log(`[collab] bootstrap listening on http://${host}:${activePort}`);
    });
};

listen(port);

const shutdown = (signal) => {
  console.log(`[collab] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
