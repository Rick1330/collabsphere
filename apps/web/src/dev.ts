import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { startHttpBootstrapServer } from "../../../packages/shared/src/bootstrap-runtime.js";

const htmlPath = new URL("./index.html", import.meta.url);

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  try {
    const html = readFileSync(htmlPath, "utf8");
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(`Failed to load index.html: ${message}`);
  }
});

startHttpBootstrapServer({
  server,
  service: "web",
  defaultPort: 3000,
});
