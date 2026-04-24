import type { CanonicalErrorCode } from "../filters/app-error.filter.js";
import { getRequestContext } from "../request-context.js";

type LogLevel = "info" | "warn" | "error";

type RequestLogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  userAgent: string;
  errorCode?: CanonicalErrorCode;
};

const getLogLevel = (statusCode: number): LogLevel => {
  if (statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warn";
  }

  return "info";
};

const getLogMessage = (statusCode: number) =>
  statusCode >= 400 ? "request_failed" : "request_completed";

const writeStructuredLog = (entry: RequestLogEntry) => {
  const serialized = `${JSON.stringify(entry)}\n`;

  if (entry.level === "info") {
    process.stdout.write(serialized);
    return;
  }

  process.stderr.write(serialized);
};

export class LoggerService {
  logRequestLifecycle({
    statusCode,
    durationMs,
    errorCode,
  }: {
    statusCode: number;
    durationMs: number;
    errorCode?: CanonicalErrorCode;
  }) {
    const context = getRequestContext();

    if (!context) {
      return;
    }

    writeStructuredLog({
      timestamp: new Date().toISOString(),
      level: getLogLevel(statusCode),
      message: getLogMessage(statusCode),
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      statusCode,
      durationMs,
      ip: context.ip,
      userAgent: context.userAgent,
      ...(errorCode ? { errorCode } : {}),
    });
  }
}
