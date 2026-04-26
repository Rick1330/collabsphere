import { AppError, ValidationAppError } from "../common/filters/app-error.filter.js";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

type ValidationIssue = {
  field: string;
  message: string;
  rule: string;
};

const minPasswordLength = 8;
const maxPasswordLength = 72;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createIssue = (field: string, message: string, rule: string): ValidationIssue => ({
  field,
  message,
  rule,
});

const hasValidEmailLength = (email: string) =>
  email.length > 0 && email.length <= 254 && !/\s/.test(email);

const splitEmail = (email: string): { local: string; domain: string } | null => {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return null;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length === 0 || domain.length === 0) return null;
  return { local, domain };
};

const hasValidDomainShape = (domain: string) => {
  const dotIndex = domain.indexOf(".");
  return dotIndex > 0 && dotIndex !== domain.length - 1;
};

const isValidEmailShape = (email: string) => {
  if (!hasValidEmailLength(email)) return false;
  const parts = splitEmail(email);
  return parts !== null && hasValidDomainShape(parts.domain);
};

const assertPasswordStrength = (password: string) => {
  const passwordByteLength = Buffer.byteLength(password, "utf8");
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordLengthValid =
    password.length >= minPasswordLength && passwordByteLength <= maxPasswordLength;
  const hasRequiredCharacterSets = hasUpper && hasLower && hasDigit && hasSpecial;

  if (!isPasswordLengthValid || !hasRequiredCharacterSets) {
    throw new AppError({
      code: "PASSWORD_TOO_WEAK",
      message: "Password does not meet complexity requirements",
    });
  }
};

const validateFullName = (fullName: string): ValidationIssue | null => {
  if (!fullName) {
    return createIssue("fullName", "Full name is required", "isNotEmpty");
  }

  if (fullName.length > 200) {
    return createIssue("fullName", "Full name must be at most 200 characters", "maxLength");
  }

  return null;
};

const validateEmailField = (email: string): ValidationIssue | null => {
  if (!email) {
    return createIssue("email", "Email is required", "isNotEmpty");
  }

  if (!isValidEmailShape(email)) {
    return createIssue("email", "Invalid email address", "isEmail");
  }

  return null;
};

const validatePasswordPresence = (password: string): ValidationIssue | null =>
  password ? null : createIssue("password", "Password is required", "isNotEmpty");

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseRegisterCandidate = (payload: unknown): Partial<Record<keyof RegisterInput, unknown>> => {
  if (isPlainObject(payload)) {
    return payload as Partial<Record<keyof RegisterInput, unknown>>;
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

export const validateRegisterInput = (payload: unknown): RegisterInput => {
  const candidate = parseRegisterCandidate(payload);
  const fullName = typeof candidate.fullName === "string" ? candidate.fullName.trim() : "";
  const email = typeof candidate.email === "string" ? candidate.email.trim() : "";
  const password = typeof candidate.password === "string" ? candidate.password : "";
  const issues = [
    validateFullName(fullName),
    validateEmailField(email),
    validatePasswordPresence(password),
  ].filter((issue): issue is ValidationIssue => issue !== null);

  if (issues.length > 0) {
    throw new ValidationAppError({
      issues,
    });
  }

  assertPasswordStrength(password);

  return {
    fullName,
    email: normalizeEmail(email),
    password,
  };
};
