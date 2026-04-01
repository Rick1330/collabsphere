import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { startHttpBootstrapServer } from "../../../packages/shared/src/bootstrap-runtime.js";

const htmlPath = new URL("./index.html", import.meta.url);

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(readFileSync(htmlPath, "utf8"));
});

startHttpBootstrapServer({
  server,
  service: "web",
  defaultPort: 3000,
});
