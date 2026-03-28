export const APP_NAME = "CollabSphere";

export const APP_SERVICES = ["web", "api", "collab", "worker"] as const;

export type AppService = (typeof APP_SERVICES)[number];

export interface ServiceHealthStatus {
  service: AppService;
  ready: boolean;
}
