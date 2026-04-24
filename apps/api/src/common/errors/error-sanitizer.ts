import type { CanonicalErrorCode } from "../filters/app-error.filter.js";
import type { ValidationErrorDetail } from "./validation-errors.js";

type ErrorEnvelopePayload = {
  code: CanonicalErrorCode;
  message: string;
  details?: ValidationErrorDetail[];
};

type SanitizedErrorEnvelopePayload = {
  message: string;
  details?: ValidationErrorDetail[];
};

const sqlPattern =
  /\b(select|insert|update|delete|drop|alter|create|truncate)\b[\s\S]*\b(from|into|table|values|set)\b/i;
const prismaPattern = /\bprisma(?:client)?\w*\b/i;
const secretPattern = /\b(password|secret|token|api[_-]?key|authorization)\b/i;
const internalIdPattern =
  /\b(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|(?:user|workspace|document|task|file|member|invitation|export)_\w+)\b/i;

const containsSensitiveContent = (value: string) =>
  sqlPattern.test(value) ||
  prismaPattern.test(value) ||
  secretPattern.test(value) ||
  internalIdPattern.test(value);

const defaultErrorMessages: Record<CanonicalErrorCode, string> = {
  VALIDATION_ERROR: "Validation failed",
  INVALID_EMAIL: "Invalid email address",
  PASSWORD_TOO_WEAK: "Password does not meet complexity requirements",
  INVALID_CREDENTIALS: "Invalid credentials",
  PASSWORD_SAME_AS_CURRENT: "New password must differ from current password",
  INVALID_DATE: "Invalid date value",
  INVALID_ENUM_VALUE: "Invalid value for the provided field",
  INVALID_JSON: "Malformed JSON request body",
  INVALID_ANCHOR: "Invalid anchor payload",
  INVALID_MENTION: "Mentioned user is not valid",
  INVALID_ASSIGNEE: "Invalid assignee",
  INVALID_LABEL: "Invalid label",
  INVALID_PARENT: "Invalid parent",
  INVALID_NEW_OWNER: "Invalid new owner",
  INVALID_FILE_TYPE: "File type not allowed",
  FILE_TOO_LARGE: "File exceeds maximum size",
  CHECKSUM_MISMATCH: "File checksum mismatch",
  TEMPLATE_CATEGORY_MISMATCH: "Template category mismatch",
  TEMPLATE_INVALID: "Template invalid",
  TEMPLATE_SCHEMA_UNSUPPORTED: "Template schema unsupported",
  UNAUTHORIZED: "Authentication required",
  TOKEN_EXPIRED: "Token expired",
  TOKEN_INVALID: "Invalid token",
  REFRESH_TOKEN_MISSING: "Refresh token missing",
  REFRESH_TOKEN_INVALID: "Refresh token invalid",
  OAUTH_INVALID_CALLBACK: "OAuth callback invalid",
  OAUTH_STATE_MISMATCH: "OAuth security check failed",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_WORKSPACE_MEMBER: "You are not a member of this workspace",
  INSUFFICIENT_ROLE: "Insufficient role for this action",
  FORBIDDEN_ROLE_ASSIGNMENT: "You cannot assign this role",
  ACCOUNT_DEACTIVATED: "Account deactivated",
  EMAIL_NOT_VERIFIED: "Email not verified",
  EDIT_WINDOW_EXPIRED: "Comment edit window expired",
  WORKSPACE_ARCHIVED_READONLY: "Workspace is archived (read-only)",
  WORKSPACE_NOT_ACADEMIC: "Workspace is not academic",
  OAUTH_USER_NO_PASSWORD: "Password managed by OAuth provider",
  DOCUMENT_LOCKED: "Document is locked",
  DOCUMENT_READONLY_STATUS: "Document is read-only in its current status",
  TEMPLATE_DISABLED: "Template disabled",
  EMAIL_MISMATCH: "This invitation was sent to a different email address",
  ADMIN_ONLY: "Admin access required",
  NOT_FOUND: "Resource not found",
  WORKSPACE_NOT_FOUND: "Workspace not found",
  DOCUMENT_NOT_FOUND: "Document not found",
  TASK_NOT_FOUND: "Task not found",
  FOLDER_NOT_FOUND: "Folder not found",
  INVITATION_NOT_FOUND: "Invitation not found",
  MEMBER_NOT_FOUND: "Member not found",
  TEMPLATE_NOT_FOUND: "Template not found",
  FILE_NOT_FOUND: "File not found",
  EXPORT_JOB_NOT_FOUND: "Export job not found",
  LINK_NOT_FOUND: "Link not found",
  TARGET_NOT_FOUND: "Target not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  ACCOUNT_EXISTS_LOCAL: "Account exists with local auth",
  ACCOUNT_EXISTS_OAUTH: "Account exists with OAuth provider",
  ACCOUNT_EXISTS_OTHER_PROVIDER: "Account exists with another provider",
  WORKSPACE_NAME_CONFLICT: "Workspace name already used",
  ALREADY_MEMBER: "You are already a member",
  ATTACHMENT_EXISTS: "Attachment already exists",
  CONCURRENT_MODIFICATION: "Resource was modified by another user",
  IDEMPOTENCY_CONFLICT: "Idempotency key conflict",
  RATE_LIMITED: "Too many requests. Please try again later.",
  INVALID_TRANSITION: "Invalid status transition",
  INVALID_STATUS: "Invalid resource status for this operation",
  CANNOT_DEMOTE_OWNER: "Cannot demote owner",
  CANNOT_REMOVE_OWNER: "Cannot remove owner",
  CANNOT_LEAVE_AS_OWNER: "Cannot leave as owner",
  NO_SUPERVISOR_ASSIGNED: "Supervisor not assigned",
  DOCUMENT_EMPTY: "Document must contain content",
  NOTE_REQUIRED: "Feedback note required",
  FOLDER_NOT_EMPTY: "Folder is not empty",
  FILE_NOT_READY: "File not ready for download or attach",
  UPLOAD_NOT_FOUND_IN_STORAGE: "Upload not found in storage",
  WORKSPACE_MISMATCH: "Workspace mismatch",
  WORKSPACE_LIMIT_REACHED: "Workspace limit reached",
  WORKSPACE_MEMBER_LIMIT_REACHED: "Workspace member limit reached",
  WORKSPACE_STORAGE_LIMIT_REACHED: "Workspace storage limit reached",
  TASK_LIMIT_REACHED: "Task limit reached",
  DOCUMENT_LIMIT_REACHED: "Document limit reached",
  INVITATION_EXPIRED: "Invitation expired",
  INVITATION_ALREADY_USED: "Invitation already used",
  TOKEN_ALREADY_USED: "Token already used",
  SERVICE_UNAVAILABLE: "Service unavailable",
  EMAIL_PROVIDER_UNAVAILABLE: "Email service unavailable",
  OAUTH_PROVIDER_UNAVAILABLE: "OAuth provider unavailable",
  STORAGE_UNAVAILABLE: "Storage service unavailable",
  COLLAB_SERVICE_UNAVAILABLE: "Collaboration service unavailable",
  INTERNAL_ERROR: "Unexpected server error",
  DATABASE_ERROR: "Database operation failed",
  TEMPLATE_APPLICATION_FAILED: "Template application failed",
  EXPORT_FAILED: "Export failed",
};

const sanitizeValidationDetails = (details: ValidationErrorDetail[] | undefined) =>
  details?.map((detail) => ({
    field: detail.field,
    message: containsSensitiveContent(detail.message)
      ? defaultErrorMessages.VALIDATION_ERROR
      : detail.message,
    rule: detail.rule,
  }));

const isAlwaysSanitizedServerError = (code: CanonicalErrorCode) =>
  code === "DATABASE_ERROR" || code === "INTERNAL_ERROR";

const sanitizeValidationPayload = ({
  message,
  details,
}: Pick<ErrorEnvelopePayload, "message" | "details">): SanitizedErrorEnvelopePayload => ({
  message: containsSensitiveContent(message) ? defaultErrorMessages.VALIDATION_ERROR : message,
  details: sanitizeValidationDetails(details),
});

const sanitizeServerErrorPayload = (code: CanonicalErrorCode): SanitizedErrorEnvelopePayload => ({
  message: getDefaultErrorMessage(code),
});

export const getDefaultErrorMessage = (code: CanonicalErrorCode) => defaultErrorMessages[code];

export const sanitizeErrorEnvelopePayload = ({
  code,
  message,
  details,
}: ErrorEnvelopePayload): SanitizedErrorEnvelopePayload => {
  if (code === "VALIDATION_ERROR") {
    return sanitizeValidationPayload({
      message,
      details,
    });
  }

  if (isAlwaysSanitizedServerError(code)) {
    return sanitizeServerErrorPayload(code);
  }

  if (containsSensitiveContent(message)) {
    return sanitizeServerErrorPayload(code);
  }

  return {
    message,
  };
};
