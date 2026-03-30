import type { z } from "zod";
import type { EnvValidationError } from "./env-core.js";

export const apiEnvKeys: readonly [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "API_BASE_URL",
  "BASE_URL",
];

export interface ApiRuntimeEnv {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL_MINUTES: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  CORS_ORIGINS: string[];
  EMAIL_PROVIDER_API_KEY: string;
  API_BASE_URL: string;
  BASE_URL: string;
}

export const apiEnvSchema: z.ZodType<ApiRuntimeEnv>;

export { EnvValidationError } from "./env-core.js";

export function parseApiRuntimeEnv(
  input: Record<string, string | undefined>,
): ApiRuntimeEnv;
