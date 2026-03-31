import { z } from "zod";
import {
  EnvValidationError,
  sharedEnvSchema,
} from "./runtime-env.js";
import {
  createPositiveInteger,
  createRequiredString,
  formatEnvValidationIssues,
} from "./env-core.js";
export { EnvValidationError } from "./runtime-env.js";

export const apiEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "API_BASE_URL",
  "BASE_URL",
]);

const baseApiEnvSchema = sharedEnvSchema
  .pick({
    DATABASE_URL: true,
    REDIS_URL: true,
    JWT_ACCESS_SECRET: true,
    JWT_ACCESS_TTL_MINUTES: true,
    REFRESH_TOKEN_TTL_DAYS: true,
    CORS_ORIGINS: true,
    EMAIL_PROVIDER_API_KEY: true,
    API_BASE_URL: true,
    BASE_URL: true,
  })
  .partial({
    EMAIL_PROVIDER_API_KEY: true,
  })
  .extend({
    EMAIL_SMTP_HOST: createRequiredString("EMAIL_SMTP_HOST").optional(),
    EMAIL_SMTP_PORT: createPositiveInteger("EMAIL_SMTP_PORT").optional(),
  })
  .strict();

export const apiEnvSchema = baseApiEnvSchema.superRefine((value, context) => {
  const hasSmtpHost = typeof value.EMAIL_SMTP_HOST === "string";
  const hasSmtpPort = typeof value.EMAIL_SMTP_PORT === "number";
  const hasProvider = typeof value.EMAIL_PROVIDER_API_KEY === "string";

  if (hasSmtpHost !== hasSmtpPort) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [hasSmtpHost ? "EMAIL_SMTP_PORT" : "EMAIL_SMTP_HOST"],
      message: "EMAIL_SMTP_HOST and EMAIL_SMTP_PORT must be set together for local SMTP.",
    });
  }

  if (!hasSmtpHost && !hasSmtpPort && !hasProvider) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["EMAIL_PROVIDER_API_KEY"],
      message: "EMAIL_PROVIDER_API_KEY is required when local SMTP is not configured.",
    });
  }
});

const selectApiEnv = (input) =>
  Object.fromEntries(apiEnvKeys.map((key) => [key, input[key]]));

export const parseApiRuntimeEnv = (input) => {
  const parsed = apiEnvSchema.safeParse(selectApiEnv(input));

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};
