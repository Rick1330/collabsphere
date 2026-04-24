import { LoggerService } from "./logger.service.js";

export const createLoggerModule = () => ({
  logger: new LoggerService(),
});
