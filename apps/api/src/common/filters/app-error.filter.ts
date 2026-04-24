import { inspect } from "node:util";
import {
  getDefaultErrorMessage,
  sanitizeErrorEnvelopePayload,
} from "../errors/error-sanitizer.js";
import {
  createValidationErrorDetails,
  type ValidationErrorDetail,
  type ValidationErrorIssue,
} from "../errors/validation-errors.js";

const validationErrorCodes = [
  "VALIDATION_ERROR",
  "INVALID_EMAIL",
  "PASSWORD_TOO_WEAK",
  "INVALID_CREDENTIALS",
  "PASSWORD_SAME_AS_CURRENT",
  "INVALID_DATE",
  "INVALID_ENUM_VALUE",
  "INVALID_JSON",
  "INVALID_ANCHOR",
  "INVALID_MENTION",
  "INVALID_ASSIGNEE",
  "INVALID_LABEL",
  "INVALID_PARENT",
  "INVALID_NEW_OWNER",
  "INVALID_FILE_TYPE",
  "FILE_TOO_LARGE",
  "CHECKSUM_MISMATCH",
  "TEMPLATE_CATEGORY_MISMATCH",
  "TEMPLATE_INVALID",
  "TEMPLATE_SCHEMA_UNSUPPORTED",
] as const;

const authenticationErrorCodes = [
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "REFRESH_TOKEN_MISSING",
  "REFRESH_TOKEN_INVALID",
  "OAUTH_INVALID_CALLBACK",
  "OAUTH_STATE_MISMATCH",
] as const;

const authorizationErrorCodes = [
  "FORBIDDEN",
  "NOT_WORKSPACE_MEMBER",
  "INSUFFICIENT_ROLE",
  "FORBIDDEN_ROLE_ASSIGNMENT",
  "ACCOUNT_DEACTIVATED",
  "EMAIL_NOT_VERIFIED",
  "EDIT_WINDOW_EXPIRED",
  "WORKSPACE_ARCHIVED_READONLY",
  "WORKSPACE_NOT_ACADEMIC",
  "OAUTH_USER_NO_PASSWORD",
  "DOCUMENT_LOCKED",
  "DOCUMENT_READONLY_STATUS",
  "TEMPLATE_DISABLED",
  "EMAIL_MISMATCH",
  "ADMIN_ONLY",
] as const;

const notFoundErrorCodes = [
  "NOT_FOUND",
  "WORKSPACE_NOT_FOUND",
  "DOCUMENT_NOT_FOUND",
  "TASK_NOT_FOUND",
  "FOLDER_NOT_FOUND",
  "INVITATION_NOT_FOUND",
  "MEMBER_NOT_FOUND",
  "TEMPLATE_NOT_FOUND",
  "FILE_NOT_FOUND",
  "EXPORT_JOB_NOT_FOUND",
  "LINK_NOT_FOUND",
  "TARGET_NOT_FOUND",
] as const;

const conflictErrorCodes = [
  "EMAIL_ALREADY_EXISTS",
  "ACCOUNT_EXISTS_LOCAL",
  "ACCOUNT_EXISTS_OAUTH",
  "ACCOUNT_EXISTS_OTHER_PROVIDER",
  "WORKSPACE_NAME_CONFLICT",
  "ALREADY_MEMBER",
  "ATTACHMENT_EXISTS",
  "CONCURRENT_MODIFICATION",
  "IDEMPOTENCY_CONFLICT",
] as const;

const rateLimitErrorCodes = ["RATE_LIMITED"] as const;

const workflowErrorCodes = [
  "INVALID_TRANSITION",
  "INVALID_STATUS",
  "CANNOT_DEMOTE_OWNER",
  "CANNOT_REMOVE_OWNER",
  "CANNOT_LEAVE_AS_OWNER",
  "NO_SUPERVISOR_ASSIGNED",
  "DOCUMENT_EMPTY",
  "NOTE_REQUIRED",
  "FOLDER_NOT_EMPTY",
  "FILE_NOT_READY",
  "UPLOAD_NOT_FOUND_IN_STORAGE",
  "WORKSPACE_MISMATCH",
  "WORKSPACE_LIMIT_REACHED",
  "WORKSPACE_MEMBER_LIMIT_REACHED",
  "WORKSPACE_STORAGE_LIMIT_REACHED",
  "TASK_LIMIT_REACHED",
  "DOCUMENT_LIMIT_REACHED",
  "INVITATION_EXPIRED",
  "INVITATION_ALREADY_USED",
  "TOKEN_ALREADY_USED",
] as const;

const externalDependencyErrorCodes = [
  "SERVICE_UNAVAILABLE",
  "EMAIL_PROVIDER_UNAVAILABLE",
  "OAUTH_PROVIDER_UNAVAILABLE",
  "STORAGE_UNAVAILABLE",
  "COLLAB_SERVICE_UNAVAILABLE",
] as const;

const internalErrorCodes = [
  "INTERNAL_ERROR",
  "DATABASE_ERROR",
  "TEMPLATE_APPLICATION_FAILED",
  "EXPORT_FAILED",
] as const;

export type CanonicalErrorCode =
  | (typeof validationErrorCodes)[number]
  | (typeof authenticationErrorCodes)[number]
  | (typeof authorizationErrorCodes)[number]
  | (typeof notFoundErrorCodes)[number]
  | (typeof conflictErrorCodes)[number]
  | (typeof rateLimitErrorCodes)[number]
  | (typeof workflowErrorCodes)[number]
  | (typeof externalDependencyErrorCodes)[number]
  | (typeof internalErrorCodes)[number];

const errorStatusByCode: Record<CanonicalErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_EMAIL: 400,
  PASSWORD_TOO_WEAK: 400,
  INVALID_CREDENTIALS: 400,
  PASSWORD_SAME_AS_CURRENT: 400,
  INVALID_DATE: 400,
  INVALID_ENUM_VALUE: 400,
  INVALID_JSON: 400,
  INVALID_ANCHOR: 400,
  INVALID_MENTION: 400,
  INVALID_ASSIGNEE: 400,
  INVALID_LABEL: 400,
  INVALID_PARENT: 400,
  INVALID_NEW_OWNER: 400,
  INVALID_FILE_TYPE: 400,
  FILE_TOO_LARGE: 400,
  CHECKSUM_MISMATCH: 400,
  TEMPLATE_CATEGORY_MISMATCH: 400,
  TEMPLATE_INVALID: 400,
  TEMPLATE_SCHEMA_UNSUPPORTED: 400,
  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  REFRESH_TOKEN_MISSING: 401,
  REFRESH_TOKEN_INVALID: 401,
  OAUTH_INVALID_CALLBACK: 401,
  OAUTH_STATE_MISMATCH: 401,
  FORBIDDEN: 403,
  NOT_WORKSPACE_MEMBER: 403,
  INSUFFICIENT_ROLE: 403,
  FORBIDDEN_ROLE_ASSIGNMENT: 403,
  ACCOUNT_DEACTIVATED: 403,
  EMAIL_NOT_VERIFIED: 403,
  EDIT_WINDOW_EXPIRED: 403,
  WORKSPACE_ARCHIVED_READONLY: 403,
  WORKSPACE_NOT_ACADEMIC: 403,
  OAUTH_USER_NO_PASSWORD: 403,
  DOCUMENT_LOCKED: 403,
  DOCUMENT_READONLY_STATUS: 403,
  TEMPLATE_DISABLED: 403,
  EMAIL_MISMATCH: 403,
  ADMIN_ONLY: 403,
  NOT_FOUND: 404,
  WORKSPACE_NOT_FOUND: 404,
  DOCUMENT_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  FOLDER_NOT_FOUND: 404,
  INVITATION_NOT_FOUND: 404,
  MEMBER_NOT_FOUND: 404,
  TEMPLATE_NOT_FOUND: 404,
  FILE_NOT_FOUND: 404,
  EXPORT_JOB_NOT_FOUND: 404,
  LINK_NOT_FOUND: 404,
  TARGET_NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 409,
  ACCOUNT_EXISTS_LOCAL: 409,
  ACCOUNT_EXISTS_OAUTH: 409,
  ACCOUNT_EXISTS_OTHER_PROVIDER: 409,
  WORKSPACE_NAME_CONFLICT: 409,
  ALREADY_MEMBER: 409,
  ATTACHMENT_EXISTS: 409,
  CONCURRENT_MODIFICATION: 409,
  IDEMPOTENCY_CONFLICT: 409,
  RATE_LIMITED: 429,
  INVALID_TRANSITION: 400,
  INVALID_STATUS: 400,
  CANNOT_DEMOTE_OWNER: 400,
  CANNOT_REMOVE_OWNER: 400,
  CANNOT_LEAVE_AS_OWNER: 400,
  NO_SUPERVISOR_ASSIGNED: 400,
  DOCUMENT_EMPTY: 400,
  NOTE_REQUIRED: 400,
  FOLDER_NOT_EMPTY: 400,
  FILE_NOT_READY: 400,
  UPLOAD_NOT_FOUND_IN_STORAGE: 400,
  WORKSPACE_MISMATCH: 400,
  WORKSPACE_LIMIT_REACHED: 400,
  WORKSPACE_MEMBER_LIMIT_REACHED: 400,
  WORKSPACE_STORAGE_LIMIT_REACHED: 400,
  TASK_LIMIT_REACHED: 400,
  DOCUMENT_LIMIT_REACHED: 400,
  INVITATION_EXPIRED: 400,
  INVITATION_ALREADY_USED: 400,
  TOKEN_ALREADY_USED: 400,
  SERVICE_UNAVAILABLE: 503,
  EMAIL_PROVIDER_UNAVAILABLE: 503,
  OAUTH_PROVIDER_UNAVAILABLE: 503,
  STORAGE_UNAVAILABLE: 503,
  COLLAB_SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  TEMPLATE_APPLICATION_FAILED: 500,
  EXPORT_FAILED: 500,
};

export type ErrorEnvelope = {
  error: {
    code: CanonicalErrorCode;
    message: string;
    details?: ValidationErrorDetail[];
    requestId: string;
    timestamp: string;
  };
};

type AppErrorOptions = {
  code: CanonicalErrorCode;
  message?: string;
  statusCode?: number;
  details?: ValidationErrorDetail[];
  cause?: unknown;
};

type CreateValidationAppErrorOptions = {
  message?: string;
  issues: readonly ValidationErrorIssue[];
  cause?: unknown;
};

type NormalizedAppError = {
  code: CanonicalErrorCode;
  message: string;
  details?: ValidationErrorDetail[];
  statusCode: number;
  originalError: unknown;
};

type CreateErrorResponseOptions = {
  error: unknown;
  requestId: string;
  timestamp?: string;
};

type CreateErrorResponseResult = {
  statusCode: number;
  payload: ErrorEnvelope;
  normalizedError: NormalizedAppError;
};

const databaseErrorPattern =
  /\bprisma(?:client)?\w*\b|\b(postgres|database|sql|query|relation|column)\b/i;

export class AppError extends Error {
  readonly code: CanonicalErrorCode;
  readonly details?: ValidationErrorDetail[];
  readonly statusCode: number;

  constructor({ code, message, statusCode, details, cause }: AppErrorOptions) {
    super(message ?? getDefaultErrorMessage(code), cause ? { cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode ?? errorStatusByCode[code];
  }
}

export class ValidationAppError extends AppError {
  constructor({ message = "Validation failed", issues, cause }: CreateValidationAppErrorOptions) {
    super({
      code: "VALIDATION_ERROR",
      message,
      details: createValidationErrorDetails(issues),
      cause,
    });
    this.name = "ValidationAppError";
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : inspect(error, { depth: 5 });
};

const resolveUnknownErrorCode = (error: unknown): CanonicalErrorCode => {
  const message = getErrorMessage(error);
  return databaseErrorPattern.test(message) ? "DATABASE_ERROR" : "INTERNAL_ERROR";
};

const normalizeAppError = (error: unknown): NormalizedAppError => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      originalError: error.cause ?? error,
    };
  }

  const code = resolveUnknownErrorCode(error);
  return {
    code,
    message: getDefaultErrorMessage(code),
    statusCode: errorStatusByCode[code],
    originalError: error,
  };
};

const formatLogPayload = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return inspect(error, { depth: 5 });
};

export const createErrorResponse = ({
  error,
  requestId,
  timestamp = new Date().toISOString(),
}: CreateErrorResponseOptions): CreateErrorResponseResult => {
  const normalizedError = normalizeAppError(error);
  const sanitized = sanitizeErrorEnvelopePayload({
    code: normalizedError.code,
    message: normalizedError.message,
    details: normalizedError.details,
  });

  return {
    statusCode: normalizedError.statusCode,
    normalizedError,
    payload: {
      error: {
        code: normalizedError.code,
        message: sanitized.message,
        ...(sanitized.details ? { details: sanitized.details } : {}),
        requestId,
        timestamp,
      },
    },
  };
};

export const logApiError = ({
  requestId,
  normalizedError,
}: {
  requestId: string;
  normalizedError: NormalizedAppError;
}) => {
  const logLine =
    `[api] request failed (${requestId}) ` +
    `[${normalizedError.code}] ${formatLogPayload(normalizedError.originalError)}`;

  if (normalizedError.statusCode >= 500) {
    console.error(logLine);
    return;
  }

  console.warn(logLine);
};
