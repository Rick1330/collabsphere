import { createServer } from "node:http";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CollabSphere Web Bootstrap</title>
  </head>
  <body>
    <main>
      <h1>CollabSphere Web</h1>
      <p>Minimal local bootstrap surface for package-level dev startup.</p>
    </main>
  </body>
</html>`;

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});

const listen = (candidatePort) => {
  server
    .once("error", (error) => {
      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[web] port ${candidatePort} in use, retrying on an ephemeral port`);
        listen(0);
        return;
      }

      throw error;
    })
    .listen(candidatePort, host, () => {
      const address = server.address();
      const activePort = typeof address === "object" && address ? address.port : candidatePort;
      console.log(`[web] bootstrap listening on http://${host}:${activePort}`);
    });
};

listen(port);

const shutdown = (signal) => {
  console.log(`[web] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
