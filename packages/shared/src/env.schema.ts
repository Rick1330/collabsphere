import type { ApiRuntimeEnv } from "./api-env.js";
import {
  credentialUrlEnvKeys,
  optionalEnvKeys,
  requiredEnvKeys,
  secretEnvKeys,
  sharedEnvSchema,
  type SharedRuntimeEnv,
} from "./runtime-env.js";
const redactedValue = "[redacted]" as const;

export {
  credentialUrlEnvKeys,
  optionalEnvKeys,
  requiredEnvKeys,
  secretEnvKeys,
  sharedEnvSchema,
};
export const declaredEnvKeys = [...requiredEnvKeys, ...optionalEnvKeys] as const;

export type SecretEnvKey = (typeof secretEnvKeys)[number];
export type CredentialUrlEnvKey = (typeof credentialUrlEnvKeys)[number];
export type RequiredEnvKey = (typeof requiredEnvKeys)[number];
export type OptionalEnvKey = (typeof optionalEnvKeys)[number];

export type SharedEnv = SharedRuntimeEnv;
export type { ApiRuntimeEnv };

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
