import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { EnvValidationError, parseApiRuntimeEnv } from "../../../packages/shared/src/api-env.js";
import { resolveEmailConfig } from "./config/email.js";
import { createAuthController } from "./auth/auth.controller.js";
import {
  createPrismaBackedRegisterService,
  type RegisterService,
} from "./auth/auth.service.js";
import {
  AppError,
  createErrorResponse,
  ValidationAppError,
} from "./common/filters/app-error.filter.js";
import {
  createActionResponsePayload,
  type SuccessResponsePayload,
  wrapSuccessResponse,
} from "./common/interceptors/response-envelope.interceptor.js";
import { createPaginatedListPayload } from "./common/interceptors/pagination.interceptor.js";
import { createLoggerModule } from "./common/logging/logger.module.js";
import { initializeRequestContext } from "./common/middleware/request-id.middleware.js";
import { parsePaginationParams, slicePageItems } from "./common/pagination/pagination.js";
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
let registerServicePromise: Promise<RegisterService> | null = null;

const createRuntimeRegisterService = async (): Promise<RegisterService> => {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    return createPrismaBackedRegisterService({
      prisma,
      bcryptCostFactor: apiEnv.BCRYPT_COST,
      jwtAccessSecret: apiEnv.JWT_ACCESS_SECRET,
    });
  } catch (error) {
    throw new AppError({
      code: "SERVICE_UNAVAILABLE",
      message: "Registration service unavailable",
      cause: error,
    });
  }
};

const getRegisterService = () => {
  if (!registerServicePromise) {
    registerServicePromise = createRuntimeRegisterService().catch((error) => {
      registerServicePromise = null;
      throw error;
    });
  }

  return registerServicePromise;
};

const authController = createAuthController({
  registerService: {
    register: async (input) => (await getRegisterService()).register(input),
  },
});

const paginationFixtureItems = Array.from({ length: 53 }, (_, index) => ({
  id: `fixture_${String(index + 1).padStart(3, "0")}`,
  name: `Fixture Item ${index + 1}`,
}));

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  requestId?: string,
  extraHeaders?: Record<string, string>,
) => {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    ...(extraHeaders ?? {}),
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
  const { statusCode, payload, normalizedError, headers } = createErrorResponse({
    error,
    requestId,
  });
  logger.logRequestLifecycle({
    statusCode,
    durationMs,
    errorCode: normalizedError.code,
  });
  return writeJson(response, statusCode, payload, requestId, headers);
};
const { healthController } = createHealthModule({
  databaseUrl: apiEnv.DATABASE_URL,
  redisUrl: apiEnv.REDIS_URL,
});

const createInvalidUrlError = (error: unknown) =>
  new ValidationAppError({
    message: "Invalid request URL",
    issues: [
      {
        field: "url",
        message: "Invalid request URL",
        rule: "isUrl",
      },
    ],
    cause: error,
  });

const parseRequestUrl = (request: IncomingMessage) => {
  try {
    return new URL(request.url ?? "/", "https://bootstrap");
  } catch (error) {
    throw createInvalidUrlError(error);
  }
};

const handleHealthRequest = async ({
  response,
  requestId,
  getDurationMs,
}: {
  response: ServerResponse;
  requestId: string;
  getDurationMs: () => number;
}) => {
  const healthResponse = await healthController.getHealth();
  logger.logRequestLifecycle({
    statusCode: healthResponse.statusCode,
    durationMs: getDurationMs(),
    ...(healthResponse.statusCode >= 400 ? { errorCode: "SERVICE_UNAVAILABLE" as const } : {}),
  });
  return writeSuccessJson(response, healthResponse.statusCode, healthResponse.payload, requestId);
};

const handlePaginationFixturesRequest = ({
  response,
  requestId,
  url,
  getDurationMs,
}: {
  response: ServerResponse;
  requestId: string;
  url: URL;
  getDurationMs: () => number;
}) => {
  const pagination = parsePaginationParams({
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize"),
  });
  const pagedItems = slicePageItems(paginationFixtureItems, pagination);

  logger.logRequestLifecycle({
    statusCode: 200,
    durationMs: getDurationMs(),
  });

  return writeSuccessJson(
    response,
    200,
    createPaginatedListPayload({
      items: pagedItems,
      totalItems: paginationFixtureItems.length,
      pagination,
    }),
    requestId,
  );
};

const handleRegisterRequest = async ({
  request,
  response,
  requestId,
  getDurationMs,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  requestId: string;
  getDurationMs: () => number;
}) => {
  const registerResult = await authController.register({
    request,
  });

  logger.logRequestLifecycle({
    statusCode: 201,
    durationMs: getDurationMs(),
  });

  return writeSuccessJson(
    response,
    201,
    createActionResponsePayload({
      message: registerResult.message,
    }),
    requestId,
  );
};

const handleRequest = async ({
  request,
  response,
  requestId,
  getDurationMs,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  requestId: string;
  getDurationMs: () => number;
}) => {
  const url = parseRequestUrl(request);

  if (request.method === "GET" && url.pathname === "/api/v1/health") {
    return handleHealthRequest({
      response,
      requestId,
      getDurationMs,
    });
  }

  if (request.method === "GET" && url.pathname === "/api/v1/pagination/fixtures") {
    return handlePaginationFixturesRequest({
      response,
      requestId,
      url,
      getDurationMs,
    });
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/register") {
    return handleRegisterRequest({
      request,
      response,
      requestId,
      getDurationMs,
    });
  }

  return writeErrorJson({
    response,
    error: new AppError({
      code: "NOT_FOUND",
      message: `No bootstrap route for ${request.method} ${url.pathname}`,
    }),
    requestId,
    durationMs: getDurationMs(),
  });
};

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestContext = initializeRequestContext(request, response);
  const startedAt = Date.now();
  const getDurationMs = () => Date.now() - startedAt;

  const requestTask = runWithRequestContext(requestContext, () =>
    handleRequest({
      request,
      response,
      requestId: requestContext.requestId,
      getDurationMs,
    }),
  );

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
