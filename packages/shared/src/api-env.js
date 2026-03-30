import {
  EnvValidationError,
  sharedEnvSchema,
} from "./runtime-env.js";
import { formatEnvValidationIssues } from "./env-core.js";
export { EnvValidationError } from "./runtime-env.js";

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

export const apiEnvSchema = sharedEnvSchema
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
