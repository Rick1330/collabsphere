import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const host = process.env.HOST ?? "127.0.0.1";
const defaultPort = 3000;

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

const port = parsePort(process.env.PORT, defaultPort, "web");

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

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});

const listen = (candidatePort: number) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[web] bootstrap listening on http://${host}:${activePort}`);
  };

  server
    .once("error", (error: NodeJS.ErrnoException) => {
      server.removeListener("listening", onListening);

      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[web] port ${candidatePort} in use, retrying on an ephemeral port`);
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
  console.log(`[web] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
