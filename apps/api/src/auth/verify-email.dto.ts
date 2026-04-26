import { ValidationAppError } from "../common/filters/app-error.filter.js";

export type VerifyEmailInput = {
  token: string;
};

type ValidationIssue = {
  field: string;
  message: string;
  rule: string;
};

const createIssue = (field: string, message: string, rule: string): ValidationIssue => ({
  field,
  message,
  rule,
});



const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseVerifyEmailCandidate = (payload: unknown): Partial<Record<keyof VerifyEmailInput, unknown>> => {
  if (isPlainObject(payload)) {
    return payload as Partial<Record<keyof VerifyEmailInput, unknown>>;
  }

  throw new ValidationAppError({
    issues: [
      {
        field: "body",
        message: "Request body must be a JSON object",
        rule: "isObject",
      },
    ],
  });
};

export const validateVerifyEmailInput = (payload: unknown): VerifyEmailInput => {
  const candidate = parseVerifyEmailCandidate(payload);
  const token = typeof candidate.token === "string" ? candidate.token.trim() : "";
  const issues = [] as ValidationIssue[];

  const tokenPattern = /^[A-Za-z0-9_-]{16,512}$/;

  if (!token) {
    issues.push(createIssue("token", "Verification token is required", "isNotEmpty"));
  } else if (!tokenPattern.test(token)) {
    issues.push(createIssue("token", "Verification token format is invalid", "matches"));
  }

  if (issues.length > 0) {
    throw new ValidationAppError({
      issues,
    });
  }

  return {
    token,
  };
};
