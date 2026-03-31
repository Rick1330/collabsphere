# Health Checks (agent-ref)

## Purpose
Provide an execution-focused reference for API health probe behavior, response shape, and load balancer probe configuration.

## Canonical Sources
- `docs/spec/13-observability/13.2-request-correlation.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/agent-ref/ops/ci-cd.md`

## Scope
- Public `GET /api/v1/health` behavior
- Response schema and status codes (`200` / `503`)
- Dependency check timeout behavior
- Load balancer probe examples

## Required Rules / Contract

### Endpoint behavior
- Method/path: `GET /api/v1/health`
- Auth: not required (public probe endpoint)
- Service: `api`
- Dependencies checked:
  - Postgres handshake probe
  - Redis `PING` probe

### Response envelope
- Probe responses currently use a dependency-state data/meta envelope:
  - `data.resource.service`
  - `data.resource.status`
  - `data.resource.checks.database`
  - `data.resource.checks.redis`
  - `meta.requestId`
- `x-request-id` header is included and matches `meta.requestId`.
- API-wide standard remains error-envelope for `4xx/5xx` (`docs/spec/09-api-standards/09.4-error-standards.md`).
- `/api/v1/health` is a documented operator-probe exception in current runtime behavior because unhealthy (`503`) responses must still expose check-state details (see story `#26` AC2 and `tests/unit/api-bootstrap-env.test.mjs` assertions).

### Status codes
- `200` when all dependency checks are healthy.
- `503` when any dependency check is unhealthy (including timeout).
- For this endpoint, `503` still returns check-state `data/meta` payload (not generic `error` envelope) so load balancers and operators can read dependency status directly.

### Example response shape
```json
{
  "data": {
    "resource": {
      "service": "api",
      "status": "healthy",
      "checks": {
        "database": { "status": "healthy", "latencyMs": 12 },
        "redis": { "status": "healthy", "latencyMs": 4 }
      }
    }
  },
  "meta": {
    "requestId": "req_<uuid>"
  }
}
```

### Unhealthy detail behavior
- On unhealthy checks, each failing dependency returns:
  - `status: "unhealthy"`
  - `latencyMs`
  - `detail` code, for example:
    - `POSTGRES_TIMEOUT`
    - `REDIS_TIMEOUT`
    - other probe error detail codes (`*_ECONNREFUSED`, `*_UNEXPECTED_*`, etc.)

### Timeout behavior
- Probe timeout is configurable via `HEALTH_CHECK_TIMEOUT_MS`.
- Default timeout budget is `2000ms` when env var is unset/invalid.
- A single deadline budget is shared across connect + read phases per dependency probe.

## Load Balancer Probe Examples

### cURL probe
```bash
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
curl -fsS "$API_BASE_URL/api/v1/health"
```

### Kubernetes readiness probe (HTTP)
```yaml
readinessProbe:
  httpGet:
    path: /api/v1/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```
- Keep readiness `timeoutSeconds` higher than the app probe timeout budget so the process can return structured `503` payloads instead of transport timeouts.

### Kubernetes liveness probe guidance
- Do **not** use dependency-aware `/api/v1/health` as `livenessProbe`, because dependency outages can trigger restart loops.
- Prefer a process-only liveness check (for example `tcpSocket` on the API port) until a dedicated lightweight liveness endpoint is available.

### NGINX upstream health endpoint example
```nginx
location = /healthz {
  proxy_pass http://api_upstream/api/v1/health;
}
```

## Edge Cases / Failure Modes
- If Redis/Postgres is unavailable, endpoint returns `503` with unhealthy check detail.
- If a dependency accepts a connection but does not respond, timeout returns deterministic unhealthy detail (`*_TIMEOUT`), not a hanging request.
- During local startup or dependency warmup, temporary `503` is expected until dependencies are healthy.

## Validation or Testing Notes
- Validate endpoint availability:
  - `curl -fsS "$API_BASE_URL/api/v1/health"`
- Validate timeout-path behavior using the timeout unit/integration test:
  - `node --test --test-name-pattern "health endpoint returns 503 quickly when redis probe times out" tests/unit/api-bootstrap-env.test.mjs`

## Related Files / Domains
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/health.service.ts`
- `apps/api/src/dev.ts`
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/ci-cd.md`
