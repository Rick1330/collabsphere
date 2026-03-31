import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

type HealthModuleOptions = {
  databaseUrl: string;
  redisUrl: string;
};

export const createHealthModule = (options: HealthModuleOptions) => {
  const healthService = new HealthService(options.databaseUrl, options.redisUrl);
  const healthController = new HealthController(healthService);

  return {
    healthService,
    healthController,
  };
};
