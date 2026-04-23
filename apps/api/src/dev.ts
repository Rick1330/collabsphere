import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { EnvValidationError, parseApiRuntimeEnv } from "../../../packages/shared/src/api-env.js";
import { resolveEmailConfig } from "./config/email.js";
import {
  type SuccessResponsePayload,
  wrapSuccessResponse,
} from "./common/interceptors/response-envelope.interceptor.js";
import { createHealthModule } from "./health/health.module.js";
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

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  requestId?: string,
) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
  } as Record<string, string>;

  if (requestId) {
    headers["x-request-id"] = requestId;
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload, null, 2));
};

const writeSuccessJson = (
  response: ServerResponse,
  statusCode: number,
  payload: SuccessResponsePayload,
  requestId: string,
) =>
  writeJson(
    response,
    statusCode,
    wrapSuccessResponse({
      payload,
      requestId,
    }),
    requestId,
  );

const createRequestId = () => `req_${randomUUID()}`;
const { healthController } = createHealthModule({
  databaseUrl: apiEnv.DATABASE_URL,
  redisUrl: apiEnv.REDIS_URL,
});

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestId = createRequestId();

  void (async () => {
    let url;

    try {
      url = new URL(request.url ?? "/", "http://bootstrap");
    } catch {
      return writeJson(
        response,
        400,
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request URL",
            requestId,
            timestamp: new Date().toISOString()
          }
        },
        requestId,
      );
    }

    if (request.method === "GET" && url.pathname === "/api/v1/health") {
      const healthResponse = await healthController.getHealth();
      return writeSuccessJson(response, healthResponse.statusCode, healthResponse.payload, requestId);
    }

    return writeJson(
      response,
      404,
      {
        error: {
          code: "NOT_FOUND",
          message: `No bootstrap route for ${request.method} ${url.pathname}`,
          requestId,
          timestamp: new Date().toISOString()
        }
      },
      requestId,
    );
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[api] bootstrap request failed (${requestId}): ${message}`);

    writeJson(
      response,
      500,
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected server error",
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      requestId,
    );
  });
});

startHttpBootstrapServer({
  server,
  service: "api",
  defaultPort: 3001,
  readyPath: "/api/v1/health",
});
