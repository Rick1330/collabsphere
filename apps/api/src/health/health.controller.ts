import { HealthService } from "./health.service.js";

type HealthEnvelope = {
  data: {
    resource: {
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
  };
  meta: {
    requestId: string;
  };
};

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  async getHealth(requestId: string): Promise<{ statusCode: number; payload: HealthEnvelope }> {
    const result = await this.healthService.runChecks();

    return {
      statusCode: result.status === "healthy" ? 200 : 503,
      payload: {
        data: {
          resource: {
            service: "api",
            status: result.status,
            checks: result.checks,
          },
        },
        meta: {
          requestId,
        },
      },
    };
  }
}
