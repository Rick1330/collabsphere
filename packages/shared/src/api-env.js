import { z } from "zod";

const positiveIntegerPattern = /^\d+$/;

export class EnvValidationError extends Error {
  constructor(issues) {
    const detail = issues.map((issue) => `${issue.key}: ${issue.message}`).join("; ");
    super(`Environment validation failed. Review .env.example and fix: ${detail}`);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

const createRequiredString = (key) =>
  z
    .string({
      error: `${key} is required.`,
    })
    .trim()
    .min(1, `${key} is required.`);

const createAbsoluteUrl = (key, protocols) =>
  createRequiredString(key).superRefine((value, context) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be a valid absolute URL.`,
      });
      return;
    }

    if (protocols && !protocols.includes(parsedUrl.protocol)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must use one of: ${protocols.join(", ")}.`,
      });
    }
  });

const createPositiveInteger = (key) =>
  createRequiredString(key)
    .refine((value) => positiveIntegerPattern.test(value), {
      message: `${key} must be a positive integer.`,
    })
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: `${key} must be a positive integer.`,
    });

const createCorsOrigins = () =>
  createRequiredString("CORS_ORIGINS")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .superRefine((origins, context) => {
      if (origins.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CORS_ORIGINS must include at least one absolute URL.",
        });
        return;
      }

      for (const origin of origins) {
        try {
          const parsedUrl = new URL(origin);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `CORS_ORIGINS entries must use http: or https: (${origin}).`,
            });
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS_ORIGINS entries must be valid absolute URLs (${origin}).`,
          });
        }
      }
    });

export const apiEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "API_BASE_URL",
  "BASE_URL",
]);

export const apiEnvSchema = z
  .object({
    DATABASE_URL: createAbsoluteUrl("DATABASE_URL"),
    REDIS_URL: createAbsoluteUrl("REDIS_URL"),
    JWT_ACCESS_SECRET: createRequiredString("JWT_ACCESS_SECRET"),
    JWT_ACCESS_TTL_MINUTES: createPositiveInteger("JWT_ACCESS_TTL_MINUTES"),
    REFRESH_TOKEN_TTL_DAYS: createPositiveInteger("REFRESH_TOKEN_TTL_DAYS"),
    CORS_ORIGINS: createCorsOrigins(),
    EMAIL_PROVIDER_API_KEY: createRequiredString("EMAIL_PROVIDER_API_KEY"),
    API_BASE_URL: createAbsoluteUrl("API_BASE_URL"),
    BASE_URL: createAbsoluteUrl("BASE_URL"),
  })
  .strict();

const toValidationIssue = (issue) => ({
  key: String(issue.path[0] ?? "env"),
  message: issue.message || "is invalid.",
});

const selectApiEnv = (input) =>
  Object.fromEntries(apiEnvKeys.map((key) => [key, input[key]]));

export const parseApiRuntimeEnv = (input) => {
  const parsed = apiEnvSchema.safeParse(selectApiEnv(input));

  if (!parsed.success) {
    throw new EnvValidationError(parsed.error.issues.map(toValidationIssue));
  }

  return parsed.data;
};
