# Collaboration Failure Modes (agent-ref)

## Purpose
Provide execution-focused failure modes and expected behaviors for collaboration services (Hocuspocus/Yjs), including degraded UX, persistence reliability, and observability requirements.

## Canonical Sources
- `docs/domains/collab/failure-modes.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — §10.2.7 Failure Modes
- `docs/spec/06-nfrs/06.2-performance.md` — reliability targets
- `docs/spec/13-observability/*` — logging/metrics constraints

## Domain Sources
- `docs/domains/collab/failure-modes.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`

## Scope
- Collaboration server outages and degraded UX
- Database outages and persistence behavior
- Auth/permission failures in realtime
- Restart/reconnect behavior
- Observability signals for detection and triage

## Required Rules / Contract

### Collaboration server down
- Document opens **read-only** with banner: “Collaboration unavailable”.
- If a last persisted snapshot is available, client may render it read-only; otherwise metadata-only view.
- Client retries reconnect automatically.
- REST remains metadata-only; must not provide editable content.

### Database down
- Realtime sync may continue temporarily.
- Persistence fails; server must retry persistence.
- Degraded mode must be surfaced to clients (banner/warning).
- Do not block collaboration on transient DB failures.

### Auth failures
- Reject connection if JWT invalid, expired, or account deactivated.
- Do not allow room join on auth failure.

### Permission changes mid-session
- Server must re-enforce permissions on next update.
- After downgrade, server rejects writes immediately.
- Client shows read-only banner.

### Server restart
- Clients reconnect automatically.
- Rooms are rejoined; re-authorization required.
- No data loss if persistence is functioning.

## Edge Cases / Failure Modes
- Collab server flapping: avoid oscillating UI; use backoff on reconnect.
- Presence/awareness may drop temporarily on reconnect; do not persist awareness state.
- Stale derived plaintext is acceptable briefly; must never bypass access controls.

## Validation or Testing Notes
- Simulate collab server outage → confirm read-only banner + retry loop.
- Simulate DB outage → confirm persistence failure logged and retries executed.
- Simulate permission downgrade mid-session → confirm server rejects updates.
- Simulate restart → confirm reconnect + re-authorization + room rejoin.

## Related Files / Domains
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/awareness-presence.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/events/socket-events.md`


