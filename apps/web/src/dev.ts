import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { startHttpBootstrapServer } from "../../../packages/shared/src/bootstrap-runtime.js";

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

startHttpBootstrapServer({
  server,
  service: "web",
  defaultPort: 3000,
});
