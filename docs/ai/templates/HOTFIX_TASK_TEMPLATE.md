# Hotfix Task Template

## Incident
- Source: `<monitoring|support|on-call|customer>`
- Severity: `<sev0|sev1|sev2|sev3>`
- Urgency: `<immediate|same-day|next-day>`
- Affected system/domain: `<api|web|collab|worker|db|infra>`
- Start time: `<YYYY-MM-DD HH:MM TZ>`

## Labels
- `type:hotfix`
- `review:critical`
- `router:<api|web|collab|worker|db|ui|shared|ops>`
- Additional: `<label>`

## Risk Notes
- `<blast radius>`
- `<data loss risk>`
- `<security impact>`

## Reproduction / Validation
```bash
<exact command or steps>
```
Expected outcomes:
- `<expected outcome>`

## Fix Steps
1. `<step>`
2. `<step>`

## Rollback Plan
- `<rollback steps>`

## Runtime Verification
- `<health checks, metrics, logs>`

## Regression Checks
- `<critical flows>`

## Handoff / Postmortem Notes
- Summary:
- Follow-ups:
- Owner:

## Done When
- [ ] Fix deployed and verified.
- [ ] Rollback plan documented.
- [ ] Regression checks completed.
- [ ] Handoff / postmortem notes recorded.

## References
- `AGENTS.md`
- `docs/agent-ref/*`
