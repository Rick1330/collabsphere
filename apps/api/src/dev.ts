import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { EnvValidationError, parseApiRuntimeEnv } from "../../../packages/shared/src/api-env.js";
import { resolveEmailConfig } from "./config/email.js";
import {
  startHttpBootstrapServer,
  validateServiceEnv,
} from "../../../packages/shared/src/bootstrap-runtime.js";

const apiEnv = validateServiceEnv({
  service: "api",
  parser: parseApiRuntimeEnv,
  validationErrorClass: EnvValidationError,
});

try {
  resolveEmailConfig(apiEnv);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api] Email configuration failed: ${message}`);
  process.exit(1);
}

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown) => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
};

const createRequestId = () => `req_${randomUUID()}`;

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
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

startHttpBootstrapServer({
  server,
  service: "api",
  defaultPort: 3001,
  readyPath: "/api/v1/health",
});
