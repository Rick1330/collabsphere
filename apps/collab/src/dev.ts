import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { EnvValidationError, parseRuntimeEnv } from "../../../packages/shared/src/runtime-env.js";
import {
  startHttpBootstrapServer,
  validateServiceEnv,
} from "../../../packages/shared/src/bootstrap-runtime.js";

validateServiceEnv({
  service: "collab",
  parser: parseRuntimeEnv,
  validationErrorClass: EnvValidationError,
});

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    service: "collab",
    status: "ok",
    mode: "bootstrap",
    detail: "Minimal placeholder for future Hocuspocus startup."
  }, null, 2));
});

startHttpBootstrapServer({
  server,
  service: "collab",
  defaultPort: 3002,
});
