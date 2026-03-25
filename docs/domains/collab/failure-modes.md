# collab/failure-modes

## Domain
Failure modes and graceful degradation for collaboration.

## Canonical Sources
- `docs/spec/10-realtime/` — failure modes
- `docs/spec/06-nfrs/` — reliability/degradation requirements
- `docs/spec/13-observability/` — metrics/logging

## Included Topics
- Collab server outage behavior
- Database outage behavior
- Restart/reconnect behavior
- Observability signals

## Failure scenarios

### Collaboration server down
Expected UX:
- Document opens read-only with banner “Collaboration unavailable” (render last persisted snapshot when available).
- Client retries reconnect.

### Database down
Expected behavior:
- Realtime sync can work temporarily.
- Persistence fails; server retries persistence.
- Observability must surface persist failures.

### Auth failures
- Reject connection if JWT invalid/expired/deactivated.

### Server restart
- Clients reconnect automatically.
- No data loss if persistence is functioning.

## Observability
Metrics/logs should include:
- active connections gauge
- broadcast latency
- persist latency + failure counters
- structured logs on connect/disconnect and persist failures
