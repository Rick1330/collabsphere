import {
  createSingleResourcePayload,
  type SingleResourcePayload,
} from "../common/interceptors/response-envelope.interceptor.js";
import { HealthService } from "./health.service.js";

type HealthResource = {
  service: "api";
  status: "healthy" | "unhealthy";
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      latencyMs: number;
      detail?: string;
    };
    redis: {
      status: "healthy" | "unhealthy";
      latencyMs: number;
      detail?: string;
    };
  };
};

type HealthResponse = {
  statusCode: number;
  payload: SingleResourcePayload<HealthResource>;
};

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  async getHealth(): Promise<HealthResponse> {
    const result = await this.healthService.runChecks();

    return {
      statusCode: result.status === "healthy" ? 200 : 503,
      payload: createSingleResourcePayload({
        service: "api",
        status: result.status,
        checks: result.checks,
      }),
    };
  }
}
