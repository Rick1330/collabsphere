import { z } from "zod";
import {
  createAbsoluteUrl,
  createCorsOrigins,
  createPositiveInteger,
  createRequiredString,
  EnvValidationError,
  formatEnvValidationIssues,
} from "./env-core.js";
export { EnvValidationError } from "./env-core.js";

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

const selectApiEnv = (input) =>
  Object.fromEntries(apiEnvKeys.map((key) => [key, input[key]]));

export const parseApiRuntimeEnv = (input) => {
  const parsed = apiEnvSchema.safeParse(selectApiEnv(input));

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};
