import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { EnvValidationError, parseApiRuntimeEnv } from "../../../packages/shared/src/api-env.js";
import { resolveEmailConfig } from "./config/email.js";
import {
  AppError,
  createErrorResponse,
  ValidationAppError,
} from "./common/filters/app-error.filter.js";
import {
  type SuccessResponsePayload,
  wrapSuccessResponse,
} from "./common/interceptors/response-envelope.interceptor.js";
import { createPaginatedListPayload } from "./common/interceptors/pagination.interceptor.js";
import { createLoggerModule } from "./common/logging/logger.module.js";
import { initializeRequestContext } from "./common/middleware/request-id.middleware.js";
import { parsePaginationParams } from "./common/pagination/pagination.js";
import { runWithRequestContext } from "./common/request-context.js";
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

const { logger } = createLoggerModule();

const paginationFixtureItems = Array.from({ length: 53 }, (_, index) => ({
  id: `fixture_${String(index + 1).padStart(3, "0")}`,
  name: `Fixture Item ${index + 1}`,
}));

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

const writeErrorJson = ({
  response,
  error,
  requestId,
  durationMs,
}: {
  response: ServerResponse;
  error: unknown;
  requestId: string;
  durationMs: number;
}) => {
  const { statusCode, payload, normalizedError } = createErrorResponse({
    error,
    requestId,
  });
  logger.logRequestLifecycle({
    statusCode,
    durationMs,
    errorCode: normalizedError.code,
  });
  return writeJson(response, statusCode, payload, requestId);
};
const { healthController } = createHealthModule({
  databaseUrl: apiEnv.DATABASE_URL,
  redisUrl: apiEnv.REDIS_URL,
});

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestContext = initializeRequestContext(request, response);
  const startedAt = Date.now();

  const getDurationMs = () => Date.now() - startedAt;

  const requestTask = runWithRequestContext(requestContext, async () => {
    let url;

    try {
      url = new URL(request.url ?? "/", "http://bootstrap");
    } catch (error) {
      return writeErrorJson({
        response,
        error: new ValidationAppError({
          message: "Invalid request URL",
          issues: [
            {
              field: "url",
              message: "Invalid request URL",
              rule: "isUrl",
            },
          ],
          cause: error,
        }),
        requestId: requestContext.requestId,
        durationMs: getDurationMs(),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/v1/health") {
      const healthResponse = await healthController.getHealth();
      logger.logRequestLifecycle({
        statusCode: healthResponse.statusCode,
        durationMs: getDurationMs(),
        ...(healthResponse.statusCode >= 400
          ? { errorCode: "SERVICE_UNAVAILABLE" as const }
          : {}),
      });
      return writeSuccessJson(
        response,
        healthResponse.statusCode,
        healthResponse.payload,
        requestContext.requestId,
      );
    }

    if (request.method === "GET" && url.pathname === "/api/v1/pagination/fixtures") {
      const pagination = parsePaginationParams({
        page: url.searchParams.get("page"),
        pageSize: url.searchParams.get("pageSize"),
      });

      return writeSuccessJson(
        response,
        200,
        createPaginatedListPayload({
          items: paginationFixtureItems,
          pagination,
        }),
        requestContext.requestId,
      );
    }

    return writeErrorJson({
      response,
      error: new AppError({
        code: "NOT_FOUND",
        message: `No bootstrap route for ${request.method} ${url.pathname}`,
      }),
      requestId: requestContext.requestId,
      durationMs: getDurationMs(),
    });
  });

  void requestTask.catch((error: unknown) => {
    runWithRequestContext(requestContext, () => {
      writeErrorJson({
        response,
        error,
        requestId: requestContext.requestId,
        durationMs: getDurationMs(),
      });
    });
  });
});

startHttpBootstrapServer({
  server,
  service: "api",
  defaultPort: 3001,
  readyPath: "/api/v1/health",
});
