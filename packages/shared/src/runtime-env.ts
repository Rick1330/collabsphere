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
export type { EnvValidationIssue } from "./env-core.js";

export const secretEnvKeys = Object.freeze([
  "JWT_ACCESS_SECRET",
  "EMAIL_PROVIDER_API_KEY",
  "COLLAB_JWT_SECRET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const);

export const credentialUrlEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
] as const);

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
] as const);

export const optionalEnvKeys = Object.freeze([
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
] as const);

export const declaredEnvKeys = Object.freeze([
  ...requiredEnvKeys,
  ...optionalEnvKeys,
] as const);

export type SecretEnvKey = (typeof secretEnvKeys)[number];
export type CredentialUrlEnvKey = (typeof credentialUrlEnvKeys)[number];
export type RequiredEnvKey = (typeof requiredEnvKeys)[number];
export type OptionalEnvKey = (typeof optionalEnvKeys)[number];
export type DeclaredEnvKey = (typeof declaredEnvKeys)[number];

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

export type SharedRuntimeEnv = z.infer<typeof sharedEnvSchema>;

const selectSharedEnv = (input: Record<string, string | undefined>) =>
  Object.fromEntries(declaredEnvKeys.map((key) => [key, input[key]])) as Record<
    DeclaredEnvKey,
    string | undefined
  >;

export const parseRuntimeEnv = (input: Record<string, string | undefined>): SharedRuntimeEnv => {
  const parsed = sharedEnvSchema.safeParse(selectSharedEnv(input));

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};
