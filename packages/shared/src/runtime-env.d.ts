import type { ZodType } from "zod";
export { EnvValidationError } from "./env-core.js";
export type { EnvValidationIssue } from "./env-core.js";

export interface SharedRuntimeEnv {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL_MINUTES: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  CORS_ORIGINS: string[];
  EMAIL_PROVIDER_API_KEY: string;
  API_BASE_URL: string;
  BASE_URL: string;
  COLLAB_DATABASE_URL: string;
  COLLAB_REDIS_URL?: string;
  COLLAB_JWT_SECRET: string;
  COLLAB_WS_URL: string;
  S3_ENDPOINT?: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_REGION: string;
}

export const secretEnvKeys: readonly [
  "JWT_ACCESS_SECRET",
  "EMAIL_PROVIDER_API_KEY",
  "COLLAB_JWT_SECRET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];

export const credentialUrlEnvKeys: readonly [
  "DATABASE_URL",
  "REDIS_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
];

export const requiredEnvKeys: readonly [
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
];

export const optionalEnvKeys: readonly [
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
];

export const declaredEnvKeys: readonly [
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
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
];

export const sharedEnvSchema: ZodType<
  SharedRuntimeEnv,
  Record<string, string | undefined>
>;

export function parseRuntimeEnv(
  input: Record<string, string | undefined>,
): SharedRuntimeEnv;
