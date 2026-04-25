import { AppError, ValidationAppError } from "../common/filters/app-error.filter.js";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;
const maxPasswordLength = 72;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const assertPasswordStrength = (password: string) => {
  const passwordByteLength = Buffer.byteLength(password, "utf8");
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (
    password.length < minPasswordLength ||
    passwordByteLength > maxPasswordLength ||
    !hasUpper ||
    !hasLower ||
    !hasDigit ||
    !hasSpecial
  ) {
    throw new AppError({
      code: "PASSWORD_TOO_WEAK",
      message: "Password does not meet complexity requirements",
    });
  }
};

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
  const issues: Array<{ field: string; message: string; rule: string }> = [];

  if (!fullName) {
    issues.push({
      field: "fullName",
      message: "Full name is required",
      rule: "isNotEmpty",
    });
  } else if (fullName.length > 200) {
    issues.push({
      field: "fullName",
      message: "Full name must be at most 200 characters",
      rule: "maxLength",
    });
  }

  if (!email) {
    issues.push({
      field: "email",
      message: "Email is required",
      rule: "isNotEmpty",
    });
  } else if (!emailPattern.test(email)) {
    issues.push({
      field: "email",
      message: "Invalid email address",
      rule: "isEmail",
    });
  }

  if (!password) {
    issues.push({
      field: "password",
      message: "Password is required",
      rule: "isNotEmpty",
    });
  }

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
