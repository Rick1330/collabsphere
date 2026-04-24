export const APP_NAME = "CollabSphere";

export const APP_SERVICES = ["web", "api", "collab", "worker"] as const;

export type AppService = (typeof APP_SERVICES)[number];

export interface ServiceHealthStatus {
  service: AppService;
  ready: boolean;
}

export * from "./constants/index.js";
export * from "./enums/index.js";
export * from "./types/index.js";
export * from "./env.js";
