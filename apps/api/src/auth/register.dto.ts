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

const isValidEmailShape = (email: string) => {
  if (email.length === 0 || email.length > 254) {
    return false;
  }

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) {
    return false;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length === 0 || domain.length === 0) {
    return false;
  }

  if (/\s/.test(email)) {
    return false;
  }

  const dotIndex = domain.indexOf(".");
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return false;
  }

  return true;
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

export const validateRegisterInput = (payload: unknown): RegisterInput => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationAppError({
      issues: [
        {
          field: "body",
          message: "Request body must be a JSON object",
          rule: "isObject",
        },
      ],
    });
  }

  const candidate = payload as Partial<Record<keyof RegisterInput, unknown>>;
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
