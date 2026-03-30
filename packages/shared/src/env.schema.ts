import { z } from "zod";
import {
  createAbsoluteUrl,
  createCorsOrigins,
  createOptionalAbsoluteUrl,
  createPositiveInteger,
  createRequiredString,
} from "./env-core.js";
const redactedValue = "[redacted]" as const;

const secretEnvKeys = [
  "JWT_ACCESS_SECRET",
  "EMAIL_PROVIDER_API_KEY",
  "COLLAB_JWT_SECRET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const credentialUrlEnvKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
] as const;

export const requiredEnvKeys = [
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
] as const;

export const optionalEnvKeys = [
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
] as const;

export const declaredEnvKeys = [...requiredEnvKeys, ...optionalEnvKeys] as const;

export const apiEnvKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "API_BASE_URL",
  "BASE_URL",
] as const;

export type SecretEnvKey = (typeof secretEnvKeys)[number];
export type CredentialUrlEnvKey = (typeof credentialUrlEnvKeys)[number];
export type RequiredEnvKey = (typeof requiredEnvKeys)[number];
export type OptionalEnvKey = (typeof optionalEnvKeys)[number];
export type ApiEnvKey = (typeof apiEnvKeys)[number];

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

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

export const apiEnvSchema = sharedEnvSchema.pick({
  DATABASE_URL: true,
  REDIS_URL: true,
  JWT_ACCESS_SECRET: true,
  JWT_ACCESS_TTL_MINUTES: true,
  REFRESH_TOKEN_TTL_DAYS: true,
  CORS_ORIGINS: true,
  EMAIL_PROVIDER_API_KEY: true,
  API_BASE_URL: true,
  BASE_URL: true,
});

export type ApiRuntimeEnv = z.infer<typeof apiEnvSchema>;

export type SanitizedSharedEnv = Omit<SharedEnv, SecretEnvKey | CredentialUrlEnvKey> &
  Record<SecretEnvKey, typeof redactedValue> &
  {
    DATABASE_URL: string;
    REDIS_URL: string;
    COLLAB_DATABASE_URL: string;
    COLLAB_REDIS_URL?: string;
  };

export const envRedaction = Object.freeze({
  redactedValue,
  secretEnvKeys,
  credentialUrlEnvKeys,
});
