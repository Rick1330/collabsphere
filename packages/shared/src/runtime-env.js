import { z } from "zod";
import {
  createAbsoluteUrl,
  createCorsOrigins,
  createOptionalAbsoluteUrl,
  createPositiveInteger,
  createRequiredString,
  EnvValidationError,
  formatEnvValidationIssues,
} from "./env-core.js";

export { EnvValidationError } from "./env-core.js";

export const secretEnvKeys = Object.freeze([
  "JWT_ACCESS_SECRET",
  "EMAIL_PROVIDER_API_KEY",
  "COLLAB_JWT_SECRET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
]);

export const credentialUrlEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
]);

export const requiredEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "API_BASE_URL",
  "BASE_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_JWT_SECRET",
  "COLLAB_WS_URL",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
]);

export const optionalEnvKeys = Object.freeze([
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
]);

export const declaredEnvKeys = Object.freeze([
  ...requiredEnvKeys,
  ...optionalEnvKeys,
]);

export const sharedEnvSchema = z
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
    COLLAB_DATABASE_URL: createAbsoluteUrl("COLLAB_DATABASE_URL"),
    COLLAB_REDIS_URL: createOptionalAbsoluteUrl("COLLAB_REDIS_URL"),
    COLLAB_JWT_SECRET: createRequiredString("COLLAB_JWT_SECRET"),
    COLLAB_WS_URL: createAbsoluteUrl("COLLAB_WS_URL", ["ws:", "wss:"]),
    S3_ENDPOINT: createOptionalAbsoluteUrl("S3_ENDPOINT"),
    S3_BUCKET: createRequiredString("S3_BUCKET"),
    S3_ACCESS_KEY_ID: createRequiredString("S3_ACCESS_KEY_ID"),
    S3_SECRET_ACCESS_KEY: createRequiredString("S3_SECRET_ACCESS_KEY"),
    S3_REGION: createRequiredString("S3_REGION"),
  })
  .strict();

const selectSharedEnv = (input) =>
  Object.fromEntries(declaredEnvKeys.map((key) => [key, input[key]]));

export const parseRuntimeEnv = (input) => {
  const parsed = sharedEnvSchema.safeParse(selectSharedEnv(input));

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};
